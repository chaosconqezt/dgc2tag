import { useState, useEffect, useCallback } from 'react';
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
  const [roots, setRoots] = useState<{ name: string; path: string }[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  // Load roots on mount
  useEffect(() => {
    fetchDirectoryRoots().then(setRoots).catch(console.error);
  }, []);

  // Expand to initial path
  useEffect(() => {
    if (!initialPath || roots.length === 0) return;
    expandToPath(initialPath);
  }, [initialPath, roots]);

  const expandToPath = async (targetPath: string) => {
    const parts = targetPath.split(/[\\/]/).filter(Boolean);
    const isWin = /^[A-Z]:$/i.test(parts[0] ?? '');
    let currentPath = isWin ? parts[0] + '\\' : '/' + (parts[1] ?? '');
    const newTree: TreeNode[] = roots.map(r => ({
      name: r.name,
      path: r.path,
      expanded: r.path === currentPath || targetPath.startsWith(r.path),
    }));

    if (newTree.length === 0) return;

    const root = newTree.find(n => targetPath.startsWith(n.path));
    if (!root) {
      setTree(newTree);
      return;
    }

    root.expanded = true;
    let current = root;

    const pathParts = targetPath.replace(root.path, '').split(/[\\/]/).filter(Boolean);
    for (const part of pathParts) {
      try {
        const children = await browseDirectory(current.path);
        current.children = children.map(c => ({
          name: c.name,
          path: c.path,
          expanded: false,
        }));

        const next = current.children.find(c => c.name === part);
        if (next) {
          next.expanded = true;
          current = next;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    setTree([...newTree]);
    setSelectedPath(targetPath);
  };

  const toggleNode = useCallback(async (node: TreeNode) => {
    if (node.expanded) {
      node.expanded = false;
      setTree([...tree]);
      return;
    }

    setLoading(true);
    try {
      const children = await browseDirectory(node.path);
      node.children = children.map(c => ({
        name: c.name,
        path: c.path,
        expanded: false,
      }));
      node.expanded = true;
      setTree([...tree]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load directory:', err);
    } finally {
      setLoading(false);
    }
  }, [tree]);

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isSelected = selectedPath === node.path;
    const indent = depth * 16;

    return (
      <div key={node.path}>
        <div
          onClick={() => { setSelectedPath(node.path); if (!node.children) toggleNode(node); }}
          onDoubleClick={() => toggleNode(node)}
          className="folder-tree-node"
          style={{
            paddingLeft: (indent + 8) + 'px',
            backgroundColor: isSelected ? 'rgba(239,68,68,0.125)' : 'transparent',
            color: isSelected ? 'var(--red)' : 'var(--text)',
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--border-light)'; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {node.children ? (
            node.expanded ? <ChevronDown size={12} className="icon-dim" /> : <ChevronRight size={12} className="icon-dim" />
          ) : (
            <span className="folder-node-spacer" />
          )}
          {node.path.endsWith('\\') || node.path === '/' ? (
            <HardDrive size={14} className="icon-dim" />
          ) : (
            <Folder size={14} className="icon-dim" />
          )}
          <span className="text-ellipsis folder-node-name">{node.name}</span>
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ width: '420px', maxHeight: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-header-title">Select folder</span>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="folder-picker-path">
          <input
            type="text"
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="folder-picker-input"
          />
        </div>

        <div className="folder-picker-tree">
          {tree.map(node => renderNode(node, 0))}
          {loading && (
            <div className="folder-picker-loading">Loading...</div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn secondary">Cancel</button>
          <button onClick={() => onSelect(selectedPath)} className="modal-btn primary">Select</button>
        </div>
      </div>
    </div>
  );
}
