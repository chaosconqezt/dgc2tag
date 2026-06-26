import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive } from 'lucide-react';
import { FONT, FS, COLORS, OVERLAY_BACKDROP, MODAL_PANEL, MODAL_HEADER, ICON_BUTTON } from './styles';
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
    // On Windows, first part is like "C:" so we need "C:\\"
    const isWin = /^[A-Z]:$/i.test(parts[0] ?? '');
    let currentPath = isWin ? parts[0] + '\\' : '/' + (parts[1] ?? '');
    const newTree: TreeNode[] = roots.map(r => ({
      name: r.name,
      path: r.path,
      expanded: r.path === currentPath || targetPath.startsWith(r.path),
    }));

    if (newTree.length === 0) return;

    // Find the root that contains the target
    const root = newTree.find(n => targetPath.startsWith(n.path));
    if (!root) {
      setTree(newTree);
      return;
    }

    root.expanded = true;
    let current = root;

    // Walk down the path, expanding each level
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
      <div style={{ ...MODAL_PANEL, width: '420px', maxHeight: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div style={MODAL_HEADER}>
          <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '600', fontFamily: FONT }}>Select folder</span>
          <button onClick={onClose} style={{ ...ICON_BUTTON, padding: '4px' }}>
            <span style={{ fontSize: '16px' }}>&times;</span>
          </button>
        </div>

        {/* Current path display */}
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}` }}>
          <input
            type="text"
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: COLORS.bg,
              border: `1px solid ${COLORS.textInvisible}`,
              borderRadius: '6px',
              padding: '6px 10px',
              color: COLORS.text,
              fontSize: FS,
              fontFamily: 'monospace',
            }}
          />
        </div>

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
