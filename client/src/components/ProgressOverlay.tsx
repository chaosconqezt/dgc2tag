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
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>
            {done ? (success ? 'Done' : 'Error') : phase}
          </span>
          {done && (
            <button onClick={onClose} className="modal-close-btn">
              Close
            </button>
          )}
        </div>

        {!done && total > 0 && (
          <div className="progress-content">
            <div className="progress-stats">
              <span className="text-muted">{current} / {total}</span>
              <span className="text-dim">{pct}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div ref={logRef} className="progress-log">
          {log.length === 0 && !done ? (
            <span className="text-invisible">Starting...</span>
          ) : (
            log.map((line, i) => (
              <div key={i} className="progress-log-line">
                {line}
              </div>
            ))
          )}
          {done && details && details.length > 0 && (
            <>
              <div className="progress-log-sep">─</div>
              {details.map((line, i) => (
                <div key={`d-${i}`} className="progress-log-line">
                  {line}
                </div>
              ))}
            </>
          )}
        </div>

        {done && (
          <div>
            <span className={success ? 'text-green' : 'text-red'}>
              {message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
