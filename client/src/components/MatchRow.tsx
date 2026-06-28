import type { AlbumTags } from '../types';
import { matchTracks } from '../utils';

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
  simClass: string;
}

export interface TrackCallbacks {
  onPerTrackNameToggle: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
}

export function MatchRow({
  m,
  localTags,
  display,
  track,
  callbacks,
}: {
  m: ReturnType<typeof matchTracks>[number];
  localTags: AlbumTags;
  display: TrackDisplayConfig;
  track: TrackState;
  callbacks: TrackCallbacks;
}) {
  const { filenameMode, showFilenamePreviews } = display;
  const { nameEnabled, isNameEdited, isUnmatched, displayName, simClass } = track;
  const { onPerTrackNameToggle, onEditedTrackNameChange } = callbacks;

  const localLabel = m.local
    ? filenameMode === 'filename' ? m.local.file : m.local.name
    : '';

  const localDuration = m.local ? localTags.trackDurations?.[m.local.file] : undefined;
  const remoteDuration = m.remote.duration;
  const displayDuration = localDuration !== undefined ? localDuration : null;

  return (
    <div className={`track-row${nameEnabled ? '' : ' disabled'}`}>
      <div className="track-chk">
        <input
          type="checkbox"
          checked={nameEnabled}
          onChange={(e) => onPerTrackNameToggle(m.remote.num, e.target.checked)}
          title={nameEnabled ? 'Writing — click to skip' : 'Skipping — click to include'}
        />
      </div>

      <div className="track-num">
        {m.local?.num || ''}
      </div>

      <div className="track-name">
        {m.local ? (
          <>
            <div title={localLabel} className="track-name-text">
              {localLabel || '—'}
            </div>
            {showFilenamePreviews && m.local && filenameMode === 'id3' && m.local.file !== m.local.name && (
              <div title={m.local.file} className="track-name-sub">{m.local.file}</div>
            )}
          </>
        ) : (
          <div className="track-name-text unmatched">unmatched</div>
        )}
      </div>

      <div className={`track-dur${displayDuration === null ? ' missing' : ''}`}>
        {formatDuration(displayDuration, 'ERR')}
      </div>

      <div className={`track-sim ${simClass}`}>
        {m.local ? `${m.sim}%` : '—'}
      </div>

      <div className="track-dur">
        {formatDuration(remoteDuration, '-:--')}
      </div>

      <div className={`track-num${m.numberMismatch ? ' warn' : ''}`}>
        {m.remote.num}
      </div>

      <div className="track-input-wrap">
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            onEditedTrackNameChange(m.remote.num, e.target.value);
            if (!nameEnabled) onPerTrackNameToggle(m.remote.num, true);
          }}
          className={`track-input${isUnmatched ? ' unmatched' : isNameEdited ? ' edited' : m.sim !== 100 ? ' mismatch' : ''}`}
        />
      </div>
    </div>
  );
}
