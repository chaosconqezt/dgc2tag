import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import type { DiffEntry } from '../hooks/appReducer';
import { DiffBlock } from './DiffLine';

interface ResultModalProps {
  success: boolean;
  message: string;
  details?: string[];
  diff?: DiffEntry[];
  onClose: () => void;
}

export function ResultModal({ success, message, details, diff, onClose }: ResultModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: 600, height: 'auto', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row gap-md">
            {success
              ? <CheckCircle size={14} className="diff-ins" />
              : <XCircle size={14} className="diff-del" />}
            <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-dim)' }}>
              {success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={14} /></button>
        </div>
        <div className="modal-body">
          <span className="console-line" style={{ color: success ? 'var(--text)' : 'var(--text)' }}>
            {message}
          </span>
          {details && details.length > 0 && (
            <div className="console">
              {details.map((line, i) => (
                <span key={i} className="console-line">{line}</span>
              ))}
            </div>
          )}
          {diff && diff.length > 0 && <DiffBlock entries={diff} />}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
