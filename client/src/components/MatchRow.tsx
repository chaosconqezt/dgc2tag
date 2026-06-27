import type { AlbumTags } from '../types';
import { matchTracks } from '../utils';
import { FONT, FS, FS_S, COLORS, CHECKBOX, INPUT_STYLE } from './styles';

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
  sc: string;
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
  const { nameEnabled, isNameEdited, isUnmatched, displayName, sc } = track;
  const { onPerTrackNameToggle, onEditedTrackNameChange } = callbacks;

  const localLabel = m.local
    ? filenameMode === 'filename' ? m.local.file : m.local.name
    : '';

  const localDuration = m.local ? localTags.trackDurations?.[m.local.file] : undefined;
  const remoteDuration = m.remote.duration;
  const displayDuration = localDuration !== undefined ? localDuration : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '2px',
      opacity: nameEnabled ? 1 : 0.95,
      borderRadius: '3px',
      padding: '1px 0',
    }}
    className="hover-bg"
    >
      <div style={{ width: '11px', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={nameEnabled}
          onChange={(e) => onPerTrackNameToggle(m.remote.num, e.target.checked)}
          title={nameEnabled ? 'Writing this track name — click to skip' : 'Skipping this track name — click to include'}
          style={{ ...CHECKBOX, cursor: 'pointer' }}
        />
      </div>

      <div style={{ flex: 1, textAlign: 'left', paddingLeft: '4px', minWidth: 0 }}>
        {m.local ? (
          <>
            <div title={localLabel} className="text-ellipsis" style={{
              fontSize: FS, fontFamily: FONT,
              color: COLORS.textMuted,
            }}>
              <span style={{ fontSize: FS_S, color: COLORS.textFaint, fontFamily: 'monospace', marginRight: '4px' }}>{m.local.num || '?'}</span>
              {localLabel || '—'}
            </div>
            {showFilenamePreviews && m.local && filenameMode === 'id3' && m.local.file !== m.local.name && (
              <div title={m.local.file} className="text-ellipsis" style={{
                fontSize: FS, fontFamily: FONT,
                color: COLORS.textFaint,
              }}>
                {m.local.file || ''}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: FS, fontFamily: FONT, color: COLORS.textInvisible, fontStyle: 'italic' }}>unmatched</div>
        )}
      </div>

      <div style={{ width: '36px', textAlign: 'right', flexShrink: 0, fontSize: FS, fontFamily: 'monospace', color: COLORS.textMuted }}>
        {formatDuration(displayDuration, 'ERR')}
      </div>

      <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
        {m.local ? (
          <span style={{ fontSize: FS, fontWeight: '600', fontFamily: 'monospace', color: sc }}>{m.sim}%</span>
        ) : (
          <span style={{ fontSize: FS, color: COLORS.textInvisible }}>—</span>
        )}
      </div>

      <div style={{ width: '36px', textAlign: 'left', flexShrink: 0, fontSize: FS, fontFamily: 'monospace', color: remoteDuration ? COLORS.textMuted : COLORS.textInvisible }}>
        {formatDuration(remoteDuration, '-:--')}
      </div>

      <div style={{ flex: 1, paddingLeft: '4px', minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: FS_S, color: m.numberMismatch ? COLORS.yellow : COLORS.textFaint, fontFamily: 'monospace', flexShrink: 0 }}>{m.remote.num}</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            onEditedTrackNameChange(m.remote.num, e.target.value);
            if (!nameEnabled) onPerTrackNameToggle(m.remote.num, true);
          }}
          style={{
            ...INPUT_STYLE,
            flex: 1,
            minWidth: 0,
            fontSize: FS,
            fontFamily: FONT,
            color: isUnmatched ? COLORS.red : (isNameEdited ? COLORS.green : (m.sim === 100 ? COLORS.textMuted : COLORS.yellow)),
            backgroundColor: isNameEdited ? COLORS.greenBg : COLORS.inputBg,
            fontWeight: isNameEdited ? '600' : '400',
            border: isNameEdited ? `1px solid ${COLORS.greenBorder}` : `1px solid ${COLORS.borderLight}`,
            padding: '3px 6px',
            borderRadius: '3px',
          }}
        />
      </div>
    </div>
  );
}
