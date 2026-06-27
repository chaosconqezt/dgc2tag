import { useEffect, useRef } from 'react';

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
    <div className="modal-backdrop" onClick={done ? onClose : undefined}>
      <div className="modal-panel" style={{ width: '500px', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font)' }}>
            {done ? (success ? 'Done' : 'Error') : phase}
          </span>
          {done && (
            <button onClick={onClose} className="modal-close-btn" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '14px', fontFamily: 'var(--font)' }}>
              Close
            </button>
          )}
        </div>

        {!done && total > 0 && (
          <div style={{ padding: '10px 14px 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontFamily: 'var(--font)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{current} / {total}</span>
              <span style={{ color: 'var(--text-dim)' }}>{pct}%</span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--red)', borderRadius: '2px', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', minHeight: '80px', maxHeight: '300px' }}>
          {log.length === 0 && !done ? (
            <span style={{ fontSize: '12px', color: 'var(--text-invisible)', fontFamily: 'var(--font)' }}>Starting...</span>
          ) : (
            log.map((line, i) => (
              <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {line}
              </div>
            ))
          )}
          {done && details && details.length > 0 && (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '6px 0' }} />
              {details.map((line, i) => (
                <div key={`d-${i}`} style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {line}
                </div>
              ))}
            </>
          )}
        </div>

        {done && (
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: success ? 'var(--green)' : 'var(--red)', fontWeight: 600, fontFamily: 'var(--font)' }}>
              {message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
