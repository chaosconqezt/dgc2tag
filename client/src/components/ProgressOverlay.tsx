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
    <div className="progress-overlay" onClick={done ? onClose : undefined}>
      <div className="progress-panel" onClick={(e) => e.stopPropagation()}>
        <div className="progress-header">
          <span className="progress-header-title">
            {done ? (success ? 'Done' : 'Error') : phase}
          </span>
          {done && (
            <button onClick={onClose} className="progress-close">Close</button>
          )}
        </div>

        <div ref={logRef} className="progress-body">
          {log.length === 0 && !done ? (
            <div className="progress-console">
              <span className="progress-console-line dim">Processing{phase ? `: ${phase}` : ''}...</span>
            </div>
          ) : (
            <div className="progress-console">
              {log.map((line, i) => (
                <span key={i} className={`progress-console-line ${line.startsWith('Renamed') ? 'renamed' : line.startsWith('Moved') ? 'moved' : line.startsWith('Error') ? 'error' : ''}`}>{line}</span>
              ))}
            </div>
          )}
          {done && diff && diff.length > 0 && (
            <>
              <div className="progress-console-sep" style={{ margin: '6px 0' }} />
              <DiffBlock entries={diff} />
            </>
          )}
        </div>

        {done && (
          <div className={`progress-footer ${success ? 'ok' : 'fail'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
