import { useEffect } from 'react';
import { Globe, X, RefreshCw } from 'lucide-react';
import { FONT, FS, COLORS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL } from './styles';

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
    <div style={OVERLAY_BACKDROP} onClick={onClose}>
      <div style={{ ...MODAL_PANEL, width: '90vw', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.inputBgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={12} color={COLORS.red} />
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>{url}</span>
          </div>
          <button onClick={onClose} style={{ ...ICON_BUTTON, padding: '4px' }}>
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
            <iframe srcDoc={content || ''} sandbox="" style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }} title="DGC Preview" />
          )}
        </div>
      </div>
    </div>
  );
}
