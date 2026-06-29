import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive } from 'lucide-react';
import { FONT, FS, FS_SM, COLORS, OVERLAY_BACKDROP, MODAL_PANEL, MODAL_HEADER, ICON_BUTTON } from './styles';
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
    const indent = depth * 16;

    return (
      <div key={node.path}>
        <div
          onClick={() => { setSelectedPath(node.path); if (!node.children) toggleNode(node); }}
          onDoubleClick={() => toggleNode(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            paddingLeft: (indent + 8) + 'px',
            cursor: 'pointer',
            borderRadius: '4px',
            backgroundColor: isSelected ? `${COLORS.red}20` : 'transparent',
            color: isSelected ? COLORS.red : COLORS.text,
            fontSize: FS,
            fontFamily: FONT,
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = COLORS.borderLight; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {node.children ? (
            node.expanded ? <ChevronDown size={12} color={COLORS.textDim} /> : <ChevronRight size={12} color={COLORS.textDim} />
          ) : (
            <span style={{ width: 12 }} />
          )}
          {node.path.endsWith('\\') || node.path === '/' ? (
            <HardDrive size={14} color={COLORS.textDim} />
          ) : (
            <Folder size={14} color={COLORS.textDim} />
          )}
          <span className="text-ellipsis" style={{ flex: 1 }}>{node.name}</span>
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
    <div style={OVERLAY_BACKDROP} onClick={onClose}>
      <div style={{ ...MODAL_PANEL, width: '480px', maxHeight: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div style={MODAL_HEADER}>
          <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '600', fontFamily: FONT }}>Select folder</span>
          <button onClick={onClose} style={{ ...ICON_BUTTON, padding: '4px' }}>
            <span style={{ fontSize: FS_SM }}>&times;</span>
          </button>
        </div>

        {/* Path input with Go button */}
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={selectedPath}
            onChange={(e) => { setSelectedPath(e.target.value); setLoadError(''); }}
            onKeyDown={handleInputKeyDown}
            placeholder="Paste a path or browse below..."
            style={{
              flex: 1,
              boxSizing: 'border-box',
              background: COLORS.bg,
              border: `1px solid ${loadError ? COLORS.red : COLORS.textInvisible}`,
              borderRadius: '6px',
              padding: '6px 10px',
              color: COLORS.text,
              fontSize: FS,
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => navigateToPath(selectedPath)}
            disabled={loading || !selectedPath}
            style={{
              padding: '6px 12px',
              background: loading ? COLORS.textInvisible : COLORS.red,
              color: COLORS.textBright,
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !selectedPath ? 'default' : 'pointer',
              fontSize: FS,
              fontFamily: FONT,
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>

        {/* Error message */}
        {loadError && (
          <div style={{ padding: '4px 14px', color: COLORS.red, fontSize: FS_SM, fontFamily: FONT }}>
            {loadError}
          </div>
        )}

        {/* Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: '200px', maxHeight: '400px' }}>
          {tree.map(node => renderNode(node, 0))}
          {loading && (
            <div style={{ padding: '8px 14px', color: COLORS.textInvisible, fontSize: FS, fontFamily: FONT }}>
              Loading...
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: 'none',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: FS,
              fontFamily: FONT,
              color: COLORS.textMuted,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedPath)}
            style={{
              padding: '6px 14px',
              background: COLORS.red,
              color: COLORS.textBright,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: FS,
              fontFamily: FONT,
              fontWeight: '600',
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
