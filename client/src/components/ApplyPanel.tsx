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
        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a3a5c'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#132940'; e.currentTarget.style.transform = 'none'; }}
        style={{ ...btnBase, background: '#132940', color: '#7dadd4', border: '1px solid #1e3d5f' }}
      >
        <ArrowRightLeft size={11} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        onMouseEnter={(e) => { e.currentTarget.style.background = '#2a1f3d'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#1f1730'; e.currentTarget.style.transform = 'none'; }}
        style={{ ...btnBase, background: '#1f1730', color: '#a892c4', border: '1px solid #2e2444' }}
      >
        <FileEdit size={11} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        onMouseEnter={(e) => { e.currentTarget.style.background = '#3a1f1f'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#2c1717'; e.currentTarget.style.transform = 'none'; }}
        style={{ ...btnBase, background: '#2c1717', color: '#c49292', border: '1px solid #3f2424' }}
      >
        <Check size={11} /> WRITE
      </button>
      <button
        onClick={onCancel}
        title="Deselect current result"
        onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.inputBgAlt2; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        style={{ ...btnBase, background: 'transparent', color: COLORS.textDim, border: `1px solid ${COLORS.border}` }}
      >
        <X size={11} /> CANCEL
      </button>
    </div>
  );
}
