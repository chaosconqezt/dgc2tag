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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: '90vw', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--panel-bg)' }}>
          <div className="row gap-md" style={{ flex: 1, minWidth: 0 }}>
            <Globe size={12} color="var(--accent)" />
            <span style={{ fontSize: 'var(--fs)', fontWeight: 500, color: 'var(--text-dim)' }} className="text-ellipsis">{url}</span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: 0, display: 'flex' }}>
          {loading ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 'var(--gap-lg)', color: 'var(--text-disabled)',
            }}>
              <RefreshCw className="spin" size={20} color="var(--accent)" />
              <span>Loading preview...</span>
            </div>
          ) : (
            <iframe srcDoc={content || ''} sandbox=""
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
              title="DGC Preview" />
          )}
        </div>
      </div>
    </div>
  );
}
