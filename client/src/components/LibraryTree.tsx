import type { FileNode } from '../types';
import { FONT, FS } from './styles';

interface LibraryTreeProps {
  tree: FileNode[];
  selectedFolder: string | null;
  expandedNodes: Set<string>;
  onToggleNode: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onCollapseAll?: () => void;
}

export function LibraryTree({ tree, selectedFolder, expandedNodes, onToggleNode, onSelectFolder }: LibraryTreeProps) {
  const ARROW_W = 6;
  const INDENT = 5;

  const renderTree = (nodes: FileNode[], depth: number): React.ReactNode[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.flatMap((node) => {
      const isDir = node.type === 'directory';
      const isExpanded = isDir && expandedNodes.has(node.path);
      const children = node.children || [];
      const hasKids = children.length > 0;
      const indent = depth * INDENT;

      const item = (
        <div key={node.path}>
          <div
            className={`tree-item ${selectedFolder === node.path ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: (indent + 4) + 'px',
              paddingRight: '4px',
              paddingTop: '1px',
              paddingBottom: '1px',
              cursor: 'pointer',
              backgroundColor: selectedFolder === node.path ? '#ef444420' : 'transparent',
              borderRadius: '3px',
              color: selectedFolder === node.path ? '#ef4444' : '#f4f4f5',
              border: selectedFolder === node.path ? '1px solid #ef444440' : '1px solid transparent',
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
                  color: '#52525b',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.1s',
                  lineHeight: 1,
                }}>
                  &#9654;
                </span>
              ) : (
                <span style={{ fontSize: FS, color: '#27272a' }}>&bull;</span>
              )}
            </span>
            <span style={{
              fontSize: FS,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isDir ? '600' : '400',
            }}>
              {node.name}
            </span>
          </div>
          {isExpanded && hasKids && (
            <div style={{ borderLeft: '1px solid #27272a', marginLeft: (indent + 4) + 'px' }}>
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
      {safeTree.length > 0
        ? renderTree(safeTree, 0)
        : <div style={{ padding: '20px', color: '#3f3f46', textAlign: 'center', fontSize: FS, fontFamily: FONT }}>Loading library...</div>
      }
    </div>
  );
}
