import { useMemo, useState, useCallback, useRef } from 'react';
import type { FileNode } from '../types';
import { FS, COLORS } from './styles';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

interface LibraryTreeProps {
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;
  onToggleNode: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onRename: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath: string }>;
  onDelete: (filePath: string) => Promise<void>;
  onMove: (oldPath: string, targetDir: string) => Promise<{ success: boolean; newPath: string }>;
}

export function LibraryTree({ tree, selectedFolder, expandedNodes, onToggleNode, onSelectFolder, onRename, onDelete, onMove }: LibraryTreeProps) {
  const ARROW_W = 6;
  const INDENT = 5;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [movingPath, setMovingPath] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const dirCountMap = useMemo(() => {
    const map = new Map<string, number>();
    const walk = (node: FileNode) => {
      let count = 0;
      for (const child of node.children || []) {
        if (child.type === 'directory') {
          count += 1 + walk(child);
        }
      }
      map.set(node.path, count);
      return count;
    };
    for (const node of tree) walk(node);
    return map;
  }, [tree]);

  const audioCountMap = useMemo(() => {
    const map = new Map<string, number>();
    const walk = (node: FileNode): number => {
      let count = 0;
      for (const child of node.children || []) {
        if (child.type === 'file') count++;
        else count += walk(child);
      }
      map.set(node.path, count);
      return count;
    };
    for (const node of tree) walk(node);
    return map;
  }, [tree]);

  // Collect all directories for move target selection
  const allDirs = useMemo(() => {
    const dirs: string[] = [];
    const walk = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          dirs.push(n.path);
          walk(n.children || []);
        }
      }
    };
    walk(tree);
    return dirs;
  }, [tree]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleRenameStart = useCallback((node: FileNode) => {
    setRenamingPath(node.path);
    setRenameValue(node.name);
    setTimeout(() => renameInputRef.current?.select(), 0);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingPath || !renameValue.trim()) {
      setRenamingPath(null);
      return;
    }
    const oldName = renamingPath.split(/[\\/]/).pop() || '';
    if (renameValue.trim() === oldName) {
      setRenamingPath(null);
      return;
    }
    try {
      await onRename(renamingPath, renameValue.trim());
    } catch (err) {
      if (import.meta.env.DEV) console.error('Rename failed:', err);
    }
    setRenamingPath(null);
  }, [renamingPath, renameValue, onRename]);

  const handleDelete = useCallback(async (node: FileNode) => {
    const label = node.type === 'directory' ? 'folder' : 'file';
    if (!window.confirm(`Delete ${label} "${node.name}"?`)) return;
    try {
      await onDelete(node.path);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Delete failed:', err);
    }
  }, [onDelete]);

  const handleMoveStart = useCallback((node: FileNode) => {
    setMovingPath(node.path);
    setContextMenu(null);
  }, []);

  const handleMoveSubmit = useCallback(async (targetDir: string) => {
    if (!movingPath) return;
    try {
      await onMove(movingPath, targetDir);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Move failed:', err);
    }
    setMovingPath(null);
  }, [movingPath, onMove]);

  const getContextMenuItems = useCallback((node: FileNode): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      { label: 'Rename', action: () => handleRenameStart(node) },
      { label: 'Move to...', action: () => handleMoveStart(node) },
      { label: 'Delete', action: () => handleDelete(node), danger: true },
    ];
    return items;
  }, [handleRenameStart, handleMoveStart, handleDelete]);

  const renderTree = (nodes: FileNode[], depth: number): React.ReactNode[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.flatMap((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = isDir && expandedNodes.has(node.path);
      const children = node.children || [];
      const hasKids = children.length > 0;
      const indent = depth * INDENT;
      const isSelected = selectedFolder === node.path;
      const dirCount = isDir ? (dirCountMap.get(node.path) ?? 0) : 0;
      const audioCount = isDir && isSelected && node.hasAudioFiles ? (audioCountMap.get(node.path) ?? 0) : 0;
      const isRenaming = renamingPath === node.path;

      const item = (
        <div key={node.path}>
          <div
            className={`tree-item ${isSelected ? 'selected' : ''}`}
            style={{
              paddingLeft: (indent + 4) + 'px',
              paddingRight: '4px',
              paddingTop: '1px',
              paddingBottom: '1px',
              marginBottom: '0px',
            }}
            title={node.name}
            onClick={() => {
              if (isDir) {
                onToggleNode(node.path);
                onSelectFolder(node.path);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <span style={{
              display: 'inline-flex',
              width: ARROW_W + 'px',
              height: ARROW_W + 'px',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginRight: '1px',
            }}>
              {isDir ? (
                <span style={{
                  fontSize: ARROW_W + 'px',
                  fontWeight: '700',
                  color: 'var(--text-faint)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.1s',
                  lineHeight: 1,
                }}>
                  &#9654;
                </span>
              ) : (
                <span style={{ fontSize: FS, color: 'var(--border)' }}>&bull;</span>
              )}
            </span>
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setRenamingPath(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="tree-renaming-input"
              />
            ) : (
              <span className="text-ellipsis" style={{
                fontSize: FS,
                fontWeight: isDir ? '600' : '400',
                flex: 1,
                minWidth: 0,
              }}>
                {node.name}
              </span>
            )}
            {isDir && (dirCount > 0 || audioCount > 0) && !isRenaming && (
              <span className="tree-badge" style={{
                color: audioCount > 0 ? 'var(--green)' : 'var(--text-faint)',
                opacity: audioCount > 0 ? 1 : 0.6,
              }}>
                {audioCount > 0 ? audioCount : dirCount}
              </span>
            )}
          </div>
          {isExpanded && hasKids && (
            <div style={{ borderLeft: '1px solid var(--border)', marginLeft: (indent + 4) + 'px' }}>
              {renderTree(children, depth + 1)}
            </div>
          )}
        </div>
      );

      return [item];
    });
  };

  const safeTree = Array.isArray(tree) ? tree : [];
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '8px' }}>
      {safeTree.length > 0
        ? renderTree(safeTree, 0)
        : <div className="tree-loading">Loading library...</div>
      }

      {/* Move dialog */}
      {movingPath && (
        <MoveDialog
          movingPath={movingPath}
          allDirs={allDirs}
          onMove={handleMoveSubmit}
          onCancel={() => setMovingPath(null)}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.node)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

function MoveDialog({ movingPath, allDirs, onMove, onCancel }: { movingPath: string; allDirs: string[]; onMove: (targetDir: string) => void; onCancel: () => void }) {
  const [filter, setFilter] = useState('');
  const currentName = movingPath.split(/[\\/]/).pop() || '';
  const currentParent = movingPath.split(/[\\/]/).slice(0, -1).join('/') || movingPath.split(/[\\/]/).slice(0, -1).join('\\');

  const filtered = allDirs.filter(d => {
    if (d === movingPath || d.startsWith(movingPath + '/') || d.startsWith(movingPath + '\\')) return false;
    if (!filter) return true;
    return d.toLowerCase().includes(filter.toLowerCase());
  }).slice(0, 50);

  return (
    <div className="move-dialog-backdrop" onClick={onCancel}>
      <div className="move-dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="move-dialog-header">
          Move "{currentName}" to...
        </div>
        <div className="move-dialog-filter-wrap">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search folders..."
            autoFocus
            className="move-dialog-filter"
          />
        </div>
        <div className="move-dialog-list">
          {filtered.map((dir) => {
            const displayName = dir.replace(currentParent, '').replace(/^[\\/]/, '');
            return (
              <button
                key={dir}
                onClick={() => onMove(dir)}
                className="move-dialog-item"
              >
                {displayName}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="move-dialog-empty">No matching folders</div>
          )}
        </div>
        <div className="move-dialog-footer">
          <button
            onClick={onCancel}
            className="modal-btn secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
