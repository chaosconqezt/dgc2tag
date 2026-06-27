import { useEffect } from 'react';
import { Globe, X, RefreshCw } from 'lucide-react';

interface WebfetchOverlayProps {
  url: string;
  content: string | null;
  loading: boolean;
  onClose: () => void;
}

export function WebfetchOverlay({ url, content, loading, onClose }: WebfetchOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ width: '90vw', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Globe size={12} className="text-red" />
            <span className="text-ellipsis modal-header-title">{url}</span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          {loading ? (
            <div className="modal-loading">
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading preview...</span>
            </div>
          ) : (
            <iframe srcDoc={content || ''} sandbox="" style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} title="DGC Preview" />
          )}
        </div>
      </div>
    </div>
  );
}
