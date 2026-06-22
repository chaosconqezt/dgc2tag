import { Globe, X, RefreshCw } from 'lucide-react';
import { FONT, FS } from './styles';

interface WebfetchOverlayProps {
  url: string;
  content: string | null;
  loading: boolean;
  onClose: () => void;
}

export function WebfetchOverlay({ url, content, loading, onClose }: WebfetchOverlayProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '90vw', height: '85vh', backgroundColor: '#18181b', borderRadius: '10px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #27272a', backgroundColor: '#0c0c0e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={12} color="#ef4444" />
            <span style={{ fontSize: FS, color: '#a1a1aa', fontWeight: '500', fontFamily: FONT }}>{url}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46' }}>
              <RefreshCw className="animate-spin" size={20} color="#ef4444" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: FS, fontFamily: FONT }}>Loading preview...</span>
            </div>
          ) : (
            <iframe srcDoc={content || ''} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} title="DGC Preview" />
          )}
        </div>
      </div>
    </div>
  );
}