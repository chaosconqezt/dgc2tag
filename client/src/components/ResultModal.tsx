import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '600px', maxWidth: '90vw', backgroundColor: COLORS.inputBg, borderRadius: '10px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.inputBgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {success ? <CheckCircle size={14} color={COLORS.green} /> : <XCircle size={14} color={COLORS.red} />}
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>{success ? 'SUCCESS' : 'ERROR'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textDim, cursor: 'pointer', padding: '4px' }}>
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
          <button onClick={onClose} style={{ padding: '6px 16px', background: success ? COLORS.green : COLORS.red, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: FS, fontFamily: FONT }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
