import { useMemo } from 'react';
import type { FileNode } from '../types';
import { FONT, FS, COLORS } from './styles';

interface LibraryTreeProps {
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;
  onToggleNode: (path: string) => void;
  onSelectFolder: (path: string) => void;
}

export function LibraryTree({ tree, selectedFolder, expandedNodes, onToggleNode, onSelectFolder }: LibraryTreeProps) {
  const ARROW_W = 6;
  const INDENT = 5;

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
            <span style={{
              fontSize: FS,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isDir ? '600' : '400',
              flex: 1,
              minWidth: 0,
            }}>
              {node.name}
            </span>
            {/* Badge: dir count or audio count */}
            {isDir && (dirCount > 0 || audioCount > 0) && (
              <span style={{
                fontSize: '10px',
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
    </div>
  );
}
