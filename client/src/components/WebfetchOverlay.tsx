import { useEffect } from 'react';
import { Globe, X, RefreshCw } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '90vw', height: '85vh', backgroundColor: COLORS.inputBg, borderRadius: '10px', border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.inputBgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={12} color={COLORS.red} />
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>{url}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textDim, cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.textInvisible }}>
              <RefreshCw className="animate-spin" size={20} color={COLORS.red} style={{ marginBottom: '8px' }} />
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
