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
  fontWeight: '700' as const,
  letterSpacing: '0.3px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer' as const,
  fontFamily: FONT,
  whiteSpace: 'nowrap' as const,
};

export function ApplyPanel({ onApplyTags, onCancel }: ApplyPanelProps) {
  return (
    <div style={{ padding: '10px', background: COLORS.bg, borderRadius: '8px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'center', gap: '10px', fontSize: FS, fontFamily: FONT }}>
      <button
        onClick={() => onApplyTags('move')}
        title="Write tags, rename files, and move to output folder"
        className="action-btn-primary"
        style={{ ...btnBase, background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', boxShadow: '0 1px 6px rgba(37, 99, 243, 0.3)' }}
      >
        <ArrowRightLeft size={16} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        className="action-btn-primary"
        style={{ ...btnBase, background: `linear-gradient(180deg, ${COLORS.purple} 0%, #7c3aed 100%)`, color: '#fff', boxShadow: `0 1px 6px rgba(167, 139, 250, 0.3)` }}
      >
        <FileEdit size={16} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        className="action-btn-primary btn-primary"
        style={{ ...btnBase, background: `linear-gradient(180deg, ${COLORS.red} 0%, #dc2626 100%)`, color: '#fff', boxShadow: `0 1px 6px rgba(239, 68, 68, 0.3)` }}
      >
        <Check size={16} /> WRITE
      </button>
      <button
        onClick={onCancel}
        title="Deselect current result"
        className="action-btn-cancel"
        style={{ ...btnBase }}
      >
        <X size={16} /> CANCEL
      </button>
    </div>
  );
}
