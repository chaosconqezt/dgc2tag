import { useEffect, useRef } from 'react';
import { FONT, FS, FS_SM, COLORS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL, MODAL_HEADER } from './styles';

interface ProgressOverlayProps {
  phase: string;
  current: number;
  total: number;
  log: string[];
  done: boolean;
  success: boolean;
  message: string;
  details?: string[];
  onClose: () => void;
}

export function ProgressOverlay({ phase, current, total, log, done, success, message, details, onClose }: ProgressOverlayProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [done, log.length]);

  return (
    <div style={OVERLAY_BACKDROP} onClick={done ? onClose : undefined}>
      <div style={{ ...MODAL_PANEL, width: '500px', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={MODAL_HEADER}>
          <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '600', fontFamily: FONT }}>
            {done ? (success ? 'Done' : 'Error') : phase}
          </span>
          {done && (
            <button onClick={onClose} style={{ ...ICON_BUTTON, fontSize: FS, fontFamily: FONT }}>
              Close
            </button>
          )}
        </div>

        {/* Progress bar */}
        {!done && total > 0 && (
          <div style={{ padding: '10px 14px 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: FS_SM, fontFamily: FONT }}>
              <span style={{ color: COLORS.textMuted }}>{current} / {total}</span>
              <span style={{ color: COLORS.textDim }}>{pct}%</span>
            </div>
            <div style={{ height: '4px', backgroundColor: COLORS.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.red, borderRadius: '2px', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {/* Log */}
        <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', minHeight: '80px', maxHeight: '300px' }}>
          {log.length === 0 && !done ? (
            <span style={{ fontSize: FS_SM, color: COLORS.textInvisible, fontFamily: FONT }}>Starting...</span>
          ) : (
            log.map((line, i) => (
              <div key={i} style={{ fontSize: FS_SM, color: COLORS.textMuted, fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {line}
              </div>
            ))
          )}
          {done && details && details.length > 0 && (
            <>
              <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '6px 0' }} />
              {details.map((line, i) => (
                <div key={`d-${i}`} style={{ fontSize: FS_SM, color: COLORS.textMuted, fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {line}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Status bar */}
        {done && (
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
            <span style={{ fontSize: FS, color: success ? COLORS.green : COLORS.red, fontWeight: '600', fontFamily: FONT }}>
              {message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
