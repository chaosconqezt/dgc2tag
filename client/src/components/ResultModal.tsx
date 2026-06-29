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
    <div className="progress-overlay" onClick={onClose}>
      <div className="progress-panel" style={{ width: '600px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="progress-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {success ? <CheckCircle size={14} className="diff-ins" /> : <XCircle size={14} className="diff-del" />}
            <span className="progress-header-title">{success ? 'SUCCESS' : 'ERROR'}</span>
          </div>
          <button onClick={onClose} className="progress-close"><X size={14} /></button>
        </div>
        <div className="progress-body">
          <div className={`progress-console-line ${success ? 'renamed' : 'error'}`} style={{ marginBottom: (details?.length || diff?.length) ? '10px' : '0', fontWeight: 600 }}>
            {message}
          </div>
          {details && details.length > 0 && (
            <div className="progress-console">
              {details.map((line, i) => (
                <span key={i} className="progress-console-line">{line}</span>
              ))}
            </div>
          )}
          {diff && diff.length > 0 && (
            <DiffBlock entries={diff} />
          )}
        </div>
        <div className="progress-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="result-modal-ok" style={{ padding: '6px 16px', background: success ? 'var(--green)' : 'var(--red)', color: 'var(--text)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs)' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
