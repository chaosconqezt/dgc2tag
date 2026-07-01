import { Check, ArrowRightLeft, FileEdit, X } from 'lucide-react';

interface ApplyPanelProps {
  onApplyTags: (mode: 'write' | 'rename' | 'move') => void;
  onCancel: () => void;
}

const btnStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  background: bg,
  color,
  border: `1px solid ${border}`,
});

export function ApplyPanel({ onApplyTags, onCancel }: ApplyPanelProps) {
  return (
    <div className="panel row" style={{ flexShrink: 0, gap: 'var(--gap-md)' }}>
      <button
        onClick={() => onApplyTags('move')}
        title="Write tags, rename files, and move to output folder"
        className="btn"
        style={{ ...btnStyle('#0f1923', '#7dadd4', '#1e2d3d'), flex: 1, padding: '6px 10px' }}
      >
        <ArrowRightLeft size={11} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        className="btn"
        style={{ ...btnStyle('#1a1424', '#a892c4', '#2a2038'), flex: 1, padding: '6px 10px' }}
      >
        <FileEdit size={11} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        className="btn"
        style={{ ...btnStyle('#1f1215', '#d4a0a0', '#331c1c'), flex: 1, padding: '6px 10px' }}
      >
        <Check size={11} /> WRITE
      </button>
      <button
        onClick={onCancel}
        title="Deselect current result"
        className="btn btn-ghost"
        style={{ flex: 1, padding: '6px 10px' }}
      >
        <X size={11} /> CANCEL
      </button>
    </div>
  );
}
