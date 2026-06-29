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
    <div className="progress-overlay" onClick={onClose}>
      <div className="progress-panel" style={{ width: '90vw', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="progress-header" data-alt="true">
          <div className="row gap-md">
            <Globe size={12} color="var(--red)" />
            <span className="text-ellipsis webfetch-url">{url}</span>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={14} /></button>
        </div>
        <div className="webfetch-body">
          {loading ? (
            <div className="webfetch-loading">
              <RefreshCw className="animate-spin" size={20} color="var(--red)" />
              <span>Loading preview...</span>
            </div>
          ) : (
            <iframe srcDoc={content || ''} sandbox="" className="webfetch-iframe" title="DGC Preview" />
          )}
        </div>
      </div>
    </div>
  );
}
