import { useMemo, useState, useCallback } from 'react';
import type { FileNode } from '../types';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { TreeItem } from './TreeItem';

interface TreeViewProps {
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;
  onToggleNode: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onRename: (oldPath: string, newName: string) => Promise<{ success: boolean; newPath: string }>;
  onDelete: (filePath: string) => Promise<void>;
  onMove: (oldPath: string, targetDir: string) => Promise<{ success: boolean; newPath: string }>;
}

interface TreeData {
  dirCount: Map<string, number>;
  audioCount: Map<string, number>;
  allDirs: string[];
}

function walkTree(tree: FileNode[]): TreeData {
  const dirCount = new Map<string, number>();
  const audioCount = new Map<string, number>();
  const allDirs: string[] = [];

  const walk = (node: FileNode): { d: number; a: number } => {
    let d = 0;
    let a = 0;
    for (const child of node.children || []) {
      if (child.type === 'directory') {
        const sub = walk(child);
        d += 1 + sub.d;
        a += sub.a;
      } else {
        a++;
      }
    }
    if (node.type === 'directory') {
      dirCount.set(node.path, d);
      audioCount.set(node.path, a);
      allDirs.push(node.path);
    }
    return { d, a };
  };

  for (const node of tree) {
    if (node.type === 'directory') walk(node);
  }

  return { dirCount, audioCount, allDirs };
}

export function TreeView({ tree, selectedFolder, expandedNodes, onToggleNode, onSelectFolder, onRename, onDelete, onMove }: TreeViewProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [movingPath, setMovingPath] = useState<string | null>(null);

  const { dirCount, audioCount, allDirs } = useMemo(() => walkTree(tree), [tree]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleRenameStart = useCallback((node: FileNode) => {
    setRenamingPath(node.path);
    setRenameValue(node.name);
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

  const getContextMenuItems = useCallback((node: FileNode): ContextMenuItem[] => [
    { label: 'Rename', action: () => handleRenameStart(node) },
    { label: 'Move to...', action: () => handleMoveStart(node) },
    { label: 'Delete', action: () => handleDelete(node), danger: true },
  ], [handleRenameStart, handleMoveStart, handleDelete]);

  const getBadge = (node: FileNode): number => {
    if (node.type !== 'directory') return 0;
    const aCount = audioCount.get(node.path) ?? 0;
    const isSel = selectedFolder === node.path;
    if (isSel && node.hasAudioFiles && aCount > 0) return aCount;
    const dCount = dirCount.get(node.path) ?? 0;
    return dCount;
  };

  const renderTree = (nodes: FileNode[], depth: number): React.ReactNode => {
    if (!Array.isArray(nodes)) return null;
    return nodes.map((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = isDir && expandedNodes.has(node.path);
      const isSelected = selectedFolder === node.path;
      const isRenaming = renamingPath === node.path;
      const hasKids = isDir && (node.children?.length ?? 0) > 0;
      const badge = getBadge(node);

      return (
        <div key={node.path}>
          <TreeItem
            node={node}
            depth={depth}
            isExpanded={isExpanded}
            isSelected={isSelected}
            badge={badge}
            isRenaming={isRenaming}
            renamingValue={renameValue}
            onToggle={onToggleNode}
            onSelect={onSelectFolder}
            onContextMenu={handleContextMenu}
            onRenameValueChange={setRenameValue}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenamingPath(null)}
          />
          {isExpanded && hasKids && renderTree(node.children!, depth + 1)}
        </div>
      );
    });
  };

  const safeTree = Array.isArray(tree) ? tree : [];

  return (
    <>
      {safeTree.length > 0 ? renderTree(safeTree, 0) : (
        <div className="text-faint" style={{ padding: 20, textAlign: 'center' }}>Loading library...</div>
      )}

      {movingPath && (
        <MoveDialog
          movingPath={movingPath}
          allDirs={allDirs}
          onMove={handleMoveSubmit}
          onCancel={() => setMovingPath(null)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.node)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
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
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}
    >
      <div onClick={(e) => e.stopPropagation()} className="panel" style={{ width: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--gap-lg) var(--gap-xl)', borderBottom: '1px solid var(--border)' }}>
          Move &ldquo;{currentName}&rdquo; to...
        </div>

        <div style={{ padding: 'var(--gap-lg) var(--gap-xl)' }}>
          <input
            type="text"
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search folders..."
            autoFocus
            style={{ padding: 'var(--gap-md) var(--gap-lg)', height: 'auto' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--gap-xl) var(--gap-xl)' }}>
          {filtered.map((dir) => {
            const displayName = dir.replace(currentParent, '').replace(/^[\\/]/, '');
            return (
              <button
                key={dir}
                onClick={() => onMove(dir)}
                className="hover-bg"
                style={{
                  display: 'block', width: '100%', padding: 'var(--gap-md) var(--gap-lg)',
                  background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                  color: 'var(--text-dim)',
                }}
              >
                {displayName}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--gap-xl)', textAlign: 'center', color: 'var(--text-faint)' }}>No matching folders</div>
          )}
        </div>

        <div style={{ padding: 'var(--gap-lg) var(--gap-xl)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}
