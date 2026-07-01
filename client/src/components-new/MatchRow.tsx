import type { AlbumTags } from '../types';
import { matchTracks } from '../utils';
import { SimPercent } from './SimPercent';

function formatDuration(seconds?: number | null, fallback?: string): string {
  if (seconds === undefined || seconds === null) return fallback ?? '';
  if (seconds === 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export interface TrackDisplayConfig {
  filenameMode: 'id3' | 'filename';
  showFilenamePreviews: boolean;
}

export interface TrackState {
  nameEnabled: boolean;
  isNameEdited: boolean;
  isUnmatched: boolean;
  displayName: string;
}

export interface TrackCallbacks {
  onPerTrackNameToggle: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
}

export function MatchRow({
  m, localTags, display, track, callbacks,
}: {
  m: ReturnType<typeof matchTracks>[number];
  localTags: AlbumTags;
  display: TrackDisplayConfig;
  track: TrackState;
  callbacks: TrackCallbacks;
}) {
  const { filenameMode, showFilenamePreviews } = display;
  const { nameEnabled, isNameEdited, isUnmatched, displayName } = track;
  const { onPerTrackNameToggle, onEditedTrackNameChange } = callbacks;

  const localLabel = m.local
    ? filenameMode === 'filename' ? m.local.file.split(/[\\/]/).pop() || m.local.file : m.local.name
    : '';

  const localDuration = m.local ? localTags.trackDurations?.[m.local.file] : undefined;
  const remoteDuration = m.remote.duration;
  const displayDuration = localDuration !== undefined ? localDuration : null;

  const inputSim = isUnmatched ? 'unmatched' : isNameEdited ? 'edited' : m.sim === 100 ? 'exact' : 'close';

  const cellNum: React.CSSProperties = { width: 22, flexShrink: 0, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)' };
  const cellMono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)' };

  return (
    <div className="tm-row hover-bg">
      <div style={{ width: 11, flexShrink: 0 }}>
        <input type="checkbox" className="cb" checked={nameEnabled}
          onChange={(e) => onPerTrackNameToggle(m.remote.num, e.target.checked)}
          title={nameEnabled ? 'Writing this track name — click to skip' : 'Skipping this track name — click to include'} />
      </div>
      <div style={cellNum}>
        {m.local ? (m.local.num || '?').padStart(2, '0') : '?'}
      </div>
      <div className="cell-fixed" style={{ flex: 1, minWidth: 0, gap: 'var(--gap-sm)' }}>
        {m.local ? (
          <>
            <span className="text-ellipsis" title={localLabel}>{localLabel || '—'}</span>
            {showFilenamePreviews && m.local && filenameMode === 'id3' && m.local.file !== m.local.name && (
              <span className="text-ellipsis" style={{ opacity: 0.5 }} title={m.local.file}>{m.local.file || ''}</span>
            )}
          </>
        ) : (
          <span style={{ opacity: 0.4, fontStyle: 'italic' }}>unmatched</span>
        )}
      </div>
      <div style={{ ...cellMono, width: 34, flexShrink: 0, textAlign: 'center' }}>
        {formatDuration(displayDuration, 'ERR')}
      </div>
      <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
        {m.local ? <SimPercent value={m.sim} /> : <span style={{ opacity: 0.4 }}>—</span>}
      </div>
      <div style={{ ...cellMono, width: 36, flexShrink: 0 }}>
        {formatDuration(remoteDuration, '-:--')}
      </div>
      <div style={cellNum}>
        {m.remote.num.padStart(2, '0')}
      </div>
      <div className="cell-fixed" style={{ flex: 1, minWidth: 0 }}>
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            onEditedTrackNameChange(m.remote.num, e.target.value);
            if (!nameEnabled) onPerTrackNameToggle(m.remote.num, true);
          }}
          data-edited={String(isNameEdited)}
          data-unmatched={String(isUnmatched)}
          data-sim={inputSim}
        />
      </div>
    </div>
  );
}
