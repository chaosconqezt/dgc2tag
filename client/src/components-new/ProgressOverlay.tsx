import { useEffect, useRef } from 'react';
import type { DiffEntry } from '../hooks/appReducer';
import { DiffBlock } from './DiffLine';

interface ProgressOverlayProps {
  phase: string;
  log: string[];
  done: boolean;
  success: boolean;
  message: string;
  diff?: DiffEntry[];
  onClose: () => void;
}

export function ProgressOverlay({ phase, log, done, success, message, diff, onClose }: ProgressOverlayProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [done, log.length]);

  return (
    <div className="modal-overlay" onClick={done ? onClose : undefined}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-dim)' }}>
            {done ? (success ? 'Done' : 'Error') : phase}
          </span>
          {done && (
            <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-dim)' }}>Close</button>
          )}
        </div>

        <div ref={logRef} className="modal-body">
          {log.length === 0 && !done ? (
            <div className="console">
              <span className="console-line" style={{ color: 'var(--text-disabled)' }}>
                Processing{phase ? `: ${phase}` : ''}...
              </span>
            </div>
          ) : (
            <div className="console">
              {log.map((line, i) => (
                <span key={i} className="console-line">{line}</span>
              ))}
            </div>
          )}
          {done && diff && diff.length > 0 && (
            <>
              <div className="console-sep" style={{ margin: '6px 0' }} />
              <DiffBlock entries={diff} />
            </>
          )}
        </div>

        {done && (
          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
