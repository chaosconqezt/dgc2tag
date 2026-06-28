import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { FONT, FS, COLORS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL, MODAL_HEADER } from './styles';

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
    <div style={OVERLAY_BACKDROP} onClick={onClose}>
      <div style={{ ...MODAL_PANEL, width: '600px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div style={MODAL_HEADER}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {success ? <CheckCircle size={14} color={COLORS.green} /> : <XCircle size={14} color={COLORS.red} />}
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>{success ? 'SUCCESS' : 'ERROR'}</span>
          </div>
          <button onClick={onClose} style={{ ...ICON_BUTTON, padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: FS, color: success ? COLORS.green : COLORS.red, fontWeight: '600', fontFamily: FONT, marginBottom: details?.length ? '10px' : '0' }}>
            {message}
          </div>
          {details && details.length > 0 && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px', backgroundColor: COLORS.bg, borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
              {details.map((line, i) => (
                <div key={i} style={{ fontSize: FS, color: COLORS.textMuted, fontFamily: FONT, padding: '2px 0', borderBottom: i < details.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 16px', background: success ? COLORS.green : COLORS.red, color: COLORS.textBright, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: FS, fontFamily: FONT }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
