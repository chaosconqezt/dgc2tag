import { Check, ArrowRightLeft, FileEdit, X } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

interface ApplyPanelProps {
  onApplyTags: (mode: 'write' | 'rename' | 'move') => void;
  onCancel: () => void;
}

const btnBase = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: '5px',
  flex: 1,
  height: '32px',
  padding: '0 12px',
  fontSize: FS,
  fontWeight: '600' as const,
  letterSpacing: '0.3px',
  borderRadius: '5px',
  cursor: 'pointer' as const,
  fontFamily: FONT,
  whiteSpace: 'nowrap' as const,
  transition: 'background 0.15s, transform 0.15s',
};

export function ApplyPanel({ onApplyTags, onCancel }: ApplyPanelProps) {
  return (
    <div style={{ padding: '10px', background: COLORS.bg, borderRadius: '8px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'center', gap: '8px', fontSize: FS, fontFamily: FONT }}>
      <button
        onClick={() => onApplyTags('move')}
        title="Write tags, rename files, and move to output folder"
        className="btn-move"
        style={btnBase}
      >
        <ArrowRightLeft size={11} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        className="btn-rename"
        style={btnBase}
      >
        <FileEdit size={11} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        className="btn-write"
        style={btnBase}
      >
        <Check size={11} /> WRITE
      </button>
      <button
        onClick={onCancel}
        title="Deselect current result"
        className="hover-lift"
        style={{ ...btnBase, background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}` }}
      >
        <X size={11} /> CANCEL
      </button>
    </div>
  );
}
