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
  const { nameEnabled, isNameEdited, isUnmatched, displayName } = track;
  const { onPerTrackNameToggle, onEditedTrackNameChange } = callbacks;

  const localLabel = m.local
    ? filenameMode === 'filename' ? m.local.file.split(/[\\/]/).pop() || m.local.file : m.local.name
    : '';

  const localDuration = m.local ? localTags.trackDurations?.[m.local.file] : undefined;
  const remoteDuration = m.remote.duration;
  const displayDuration = localDuration !== undefined ? localDuration : null;

  const inputSim = isUnmatched ? 'unmatched' : isNameEdited ? 'edited' : m.sim === 100 ? 'exact' : 'close';

  return (
    <div className="mr-row hover-bg" data-enabled={String(nameEnabled)}>
      <div className="mr-check">
        <input
          type="checkbox"
          className="cb"
          checked={nameEnabled}
          onChange={(e) => onPerTrackNameToggle(m.remote.num, e.target.checked)}
          title={nameEnabled ? 'Writing this track name — click to skip' : 'Skipping this track name — click to include'}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div className="mr-cell-num">
        {m.local ? (m.local.num || '?').padStart(2, '0') : '?'}
      </div>

      <div className="t-cell mr-local">
        {m.local ? (
          <>
            <div title={localLabel} className="text-ellipsis mr-local-name">
              {localLabel || '—'}
            </div>
            {showFilenamePreviews && m.local && filenameMode === 'id3' && m.local.file !== m.local.name && (
              <div title={m.local.file} className="text-ellipsis mr-local-file">
                {m.local.file || ''}
              </div>
            )}
          </>
        ) : (
          <div className="mr-local-unmatched">unmatched</div>
        )}
      </div>

      <div className="mr-duration">
        {formatDuration(displayDuration, 'ERR')}
      </div>

      <div className="mr-sim">
        {m.local ? (
          <SimPercent value={m.sim} className="mr-sim-val" />
        ) : (
          <span className="mr-sim-dash">—</span>
        )}
      </div>

      <div className="mr-remote-duration" data-has={String(!!remoteDuration)}>
        {formatDuration(remoteDuration, '-:--')}
      </div>

      <div className="mr-cell-num">
        {m.remote.num.padStart(2, '0')}
      </div>

      <input
        type="text"
        className="t-cell tc-input mr-track-input"
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
  );
}
