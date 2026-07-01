import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive } from 'lucide-react';
import { fetchDirectoryRoots, browseDirectory } from '../api';

interface FolderPickerProps {
  initialPath: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  expanded?: boolean;
}

export function FolderPicker({ initialPath, onSelect, onClose }: FolderPickerProps) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const treeRef = useRef<TreeNode[]>([]);

  const syncTree = useCallback((newTree: TreeNode[]) => {
    treeRef.current = newTree;
    setTree(newTree);
  }, []);

  const loadRoots = useCallback(async (customPath?: string) => {
    const data = await fetchDirectoryRoots(customPath);
    const newTree: TreeNode[] = data.map(r => ({ name: r.name, path: r.path, expanded: false }));
    syncTree(newTree);
  }, [syncTree]);

  // Load roots on mount, then expand to initial path
  useEffect(() => {
    (async () => {
      await loadRoots();
      if (initialPath) {
        expandTreeToPath(initialPath);
      }
    })();
  }, []);

  // Compute the root prefix for any filesystem path
  const getRootPrefix = useCallback((p: string): string => {
    if (p.startsWith('\\\\')) {
      const parts = p.split(/[\\/]/).filter(Boolean);
      return '\\\\' + parts.slice(0, 2).join('\\');
    }
    const m = p.match(/^[A-Z]:\\/i);
    if (m) return m[0].toUpperCase();
    if (p.startsWith('/')) return '/';
    return '';
  }, []);

  // Walk tree from root down to targetPath, expanding folders
  const walkTreeToPath = useCallback(async (newTree: TreeNode[], targetPath: string, rootPrefix: string) => {
    let root = newTree.find(n => targetPath.startsWith(n.path));
    if (!root) return false;
    root.expanded = true;
    let current = root;
    const relParts = targetPath.replace(rootPrefix, '').split(/[\\/]/).filter(Boolean);

    for (const part of relParts) {
      try {
        const children = await browseDirectory(current.path);
        current.children = children.map(c => ({ name: c.name, path: c.path, expanded: false }));
        const next = current.children.find(c => c.name === part);
        if (next) { next.expanded = true; current = next; }
        else break;
      } catch { break; }
    }
    return true;
  }, []);

  const expandTreeToPath = useCallback(async (targetPath: string) => {
    if (!targetPath) return;
    const rootPrefix = getRootPrefix(targetPath);
    if (!rootPrefix) return;

    let newTree = treeRef.current;
    let rootIdx = newTree.findIndex(r => r.path.toLowerCase() === rootPrefix.toLowerCase());

    // Root not in tree — reload roots with the UNC parent (not full path)
    if (rootIdx < 0) {
      await loadRoots(rootPrefix);
      newTree = treeRef.current;
      rootIdx = newTree.findIndex(r => r.path.toLowerCase() === rootPrefix.toLowerCase());
      if (rootIdx < 0) return;
    }

    const expanded = newTree.map((n, i) => ({ ...n, expanded: i === rootIdx || targetPath.startsWith(n.path) }));
    const ok = await walkTreeToPath(expanded, targetPath, rootPrefix);
    if (ok) {
      syncTree(expanded);
      setSelectedPath(targetPath);
    }
  }, [getRootPrefix, loadRoots, walkTreeToPath, syncTree]);

  const navigateToPath = useCallback(async (path: string) => {
    if (!path) return;
    setLoading(true);
    setLoadError('');

    try {
      await browseDirectory(path); // validate path exists
      setSelectedPath(path);
      await expandTreeToPath(path);
    } catch {
      setLoadError(`Cannot access "${path}"`);
    } finally {
      setLoading(false);
    }
  }, [expandTreeToPath]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigateToPath((e.target as HTMLInputElement).value);
    }
  }, [navigateToPath]);

  const toggleNode = useCallback(async (node: TreeNode) => {
    if (node.expanded) {
      node.expanded = false;
      syncTree([...treeRef.current]);
      return;
    }
    setLoading(true);
    try {
      const children = await browseDirectory(node.path);
      node.children = children.map(c => ({ name: c.name, path: c.path, expanded: false }));
      node.expanded = true;
      syncTree([...treeRef.current]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load directory:', err);
    } finally {
      setLoading(false);
    }
  }, [syncTree]);

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.path}>
        <div
          className="folder-node"
          data-selected={String(isSelected)}
          style={{ '--indent': ((depth * 16) + 8) + 'px' } as React.CSSProperties}
          onClick={() => { setSelectedPath(node.path); if (!node.children) toggleNode(node); }}
          onDoubleClick={() => toggleNode(node)}
        >
          {node.children ? (
            node.expanded ? <ChevronDown size={12} className="folder-node-icon" /> : <ChevronRight size={12} className="folder-node-icon" />
          ) : (
            <span className="folder-node-spacer" />
          )}
          {node.path.endsWith('\\') || node.path === '/' ? (
            <HardDrive size={14} className="folder-node-icon" />
          ) : (
            <Folder size={14} className="folder-node-icon" />
          )}
          <span className="text-ellipsis flex-1">{node.name}</span>
        </div>
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="progress-overlay" onClick={onClose}>
      <div className="progress-panel folder-panel" onClick={(e) => e.stopPropagation()}>
        <div className="progress-header" data-alt="true">
          <span className="folder-picker-header-title">Select folder</span>
          <button onClick={onClose} className="btn-icon">
            <span className="folder-picker-close-x">&times;</span>
          </button>
        </div>

        {/* Path input with Go button */}
        <div className="folder-input-row">
          <input
            type="text"
            className="folder-path-input"
            data-error={String(!!loadError)}
            value={selectedPath}
            onChange={(e) => { setSelectedPath(e.target.value); setLoadError(''); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Paste a path or browse below..."
          />
          <button
            className="folder-go-btn"
            disabled={loading || !selectedPath}
            onClick={() => navigateToPath(selectedPath)}
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>

        {/* Error message */}
        {loadError && (
          <div className="folder-error">{loadError}</div>
        )}

        {/* Tree */}
        <div className="folder-tree">
          {tree.map(node => renderNode(node, 0))}
          {loading && <div className="folder-loading">Loading...</div>}
        </div>

        {/* Actions */}
        <div className="folder-actions">
          <button className="folder-btn" onClick={onClose}>Cancel</button>
          <button className="folder-btn-primary" onClick={() => onSelect(selectedPath)}>Select</button>
        </div>
      </div>
    </div>
  );
}
