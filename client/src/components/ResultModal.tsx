import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ResultModalProps {
  success: boolean;
  message: string;
  details?: string[];
  onClose: () => void;
}

export function ResultModal({ success, message, details, onClose }: ResultModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ width: '600px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            {success ? <CheckCircle size={14} className="text-green" /> : <XCircle size={14} className="text-red" />}
            <span className="modal-header-title">{success ? 'SUCCESS' : 'ERROR'}</span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={14} />
          </button>
        </div>
        <div className="modal-content">
          <div className={`result-modal-message ${success ? 'text-green' : 'text-red'}`}>
            {message}
          </div>
          {details && details.length > 0 && (
            <div className="result-modal-details">
              {details.map((line, i) => (
                <div key={i} className="result-modal-detail-line" style={{ borderBottom: i < details.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className={`modal-btn ${success ? 'success' : 'danger'}`}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
