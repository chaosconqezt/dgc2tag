import { Check, ArrowRightLeft, FileEdit, X } from 'lucide-react';

interface ApplyPanelProps {
  onApplyTags: (mode: 'write' | 'rename' | 'move') => void;
  onCancel: () => void;
}

export function ApplyPanel({ onApplyTags, onCancel }: ApplyPanelProps) {
  return (
    <div className="apply-panel">
      <button
        onClick={() => onApplyTags('move')}
        title="Write tags, rename files, and move to output folder"
        className="btn-action move"
      >
        <ArrowRightLeft size={11} /> WRITE & MOVE
      </button>
      <button
        onClick={() => onApplyTags('rename')}
        title="Write tags and rename files to 'Track. Artist - Title.ext'"
        className="btn-action rename"
      >
        <FileEdit size={11} /> WRITE & RENAME
      </button>
      <button
        onClick={() => onApplyTags('write')}
        title="Write tags only, do not rename or move files"
        className="btn-action write"
      >
        <Check size={11} /> WRITE
      </button>
      <button
        onClick={onCancel}
        title="Deselect current result"
        className="btn-action cancel"
      >
        <X size={11} /> CANCEL
      </button>
    </div>
  );
}
