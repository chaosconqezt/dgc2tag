import { memo, useRef, useEffect } from 'react';
import type { FileNode } from '../types';

interface TreeItemProps {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  badge: number;
  isRenaming: boolean;
  renamingValue: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onRenameValueChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

export const TreeItem = memo(function TreeItem({
  node, depth, isExpanded, isSelected, badge,
  isRenaming, renamingValue,
  onToggle, onSelect, onContextMenu,
  onRenameValueChange, onRenameSubmit, onRenameCancel,
}: TreeItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const isDir = node.type === 'directory';
  const arrow = isDir ? '\u25B6' : '\u2022';
  const indent = 4 + depth * 10;

  return (
    <div
      className="row hover-bg"
      style={{
        paddingLeft: indent,
        gap: 4,
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        border: isSelected ? '1px solid #acacac' : '1px solid transparent',
        background: isSelected ? '#290000' : undefined,
      }}
      title={node.name}
      onClick={() => { if (isDir) { onToggle(node.path); onSelect(node.path); } }}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <span
        style={{
          fontSize: 6,
          lineHeight: 1,
          flexShrink: 0,
          color: isDir ? undefined : 'var(--border)',
          transition: 'transform 0.1s',
          transform: isExpanded ? 'rotate(90deg)' : 'none',
          marginRight: 4,
        }}
      >
        {arrow}
      </span>

      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          className="input"
          style={{ height: 20, padding: '0 4px' }}
          value={renamingValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onBlur={onRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-ellipsis flex-1">{node.name}</span>
      )}

      {badge > 0 && !isRenaming && (
        <span className="badge">{badge}</span>
      )}
    </div>
  );
});
