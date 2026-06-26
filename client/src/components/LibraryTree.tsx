import { useMemo, useState, useCallback, useRef } from 'react';
import type { FileNode } from '../types';
import { FONT, FS, FS_XS, COLORS } from './styles';
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
              display: 'flex',
              alignItems: 'center',
              paddingLeft: (indent + 4) + 'px',
              paddingRight: '4px',
              paddingTop: '1px',
              paddingBottom: '1px',
              cursor: 'pointer',
              backgroundColor: isSelected ? `${COLORS.red}20` : 'transparent',
              borderRadius: '3px',
              color: isSelected ? COLORS.red : COLORS.text,
              border: isSelected ? `1px solid ${COLORS.red}40` : '1px solid transparent',
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
                  color: COLORS.textFaint,
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.1s',
                  lineHeight: 1,
                }}>
                  &#9654;
                </span>
              ) : (
                <span style={{ fontSize: FS, color: COLORS.border }}>&bull;</span>
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
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: FS,
                  fontFamily: FONT,
                  background: COLORS.inputBg,
                  border: `1px solid ${COLORS.red}`,
                  borderRadius: '3px',
                  padding: '0 4px',
                  color: COLORS.text,
                  outline: 'none',
                }}
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
            {/* Badge: dir count or audio count */}
            {isDir && (dirCount > 0 || audioCount > 0) && !isRenaming && (
              <span style={{
                fontSize: FS_XS,
                color: audioCount > 0 ? COLORS.green : COLORS.textFaint,
                fontFamily: 'monospace',
                flexShrink: 0,
                marginLeft: '4px',
                opacity: audioCount > 0 ? 1 : 0.6,
              }}>
                {audioCount > 0 ? audioCount : dirCount}
              </span>
            )}
          </div>
          {isExpanded && hasKids && (
            <div style={{ borderLeft: `1px solid ${COLORS.border}`, marginLeft: (indent + 4) + 'px' }}>
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
        : <div style={{ padding: '20px', color: COLORS.textInvisible, textAlign: 'center', fontSize: FS, fontFamily: FONT }}>Loading library...</div>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onCancel}>
      <div style={{ backgroundColor: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', width: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: '600', fontSize: FS, fontFamily: FONT, color: COLORS.text }}>
          Move "{currentName}" to...
        </div>
        <div style={{ padding: '8px 14px' }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search folders..."
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', background: COLORS.bg, border: `1px solid ${COLORS.textInvisible}`, borderRadius: '6px', padding: '6px 10px', color: COLORS.text, fontSize: FS, fontFamily: FONT, outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px' }}>
          {filtered.map((dir) => {
            const displayName = dir.replace(currentParent, '').replace(/^[\\/]/, '');
            return (
              <button
                key={dir}
                onClick={() => onMove(dir)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: FS,
                  fontFamily: FONT,
                  color: COLORS.textMuted,
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.borderLight)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {displayName}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: COLORS.textInvisible, fontSize: FS, fontFamily: FONT }}>
              No matching folders
            </div>
          )}
        </div>
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '6px 14px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: FS, fontFamily: FONT, color: COLORS.textMuted }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
