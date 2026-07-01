import type { AlbumTags } from '../types';
import { matchTracks, similarity, stripParentheses } from '../utils';
import { MatchRow, type TrackDisplayConfig, type TrackCallbacks } from './MatchRow';
import { SimPercent } from './SimPercent';
import { TrackArtistField } from './TrackArtistField';

export function MultiArtistTracks({
  matched, localTags, writeTrackNames, writeTrackArtists,
  trackNameEnabled, trackArtistsEnabled, editedTrackNames, editedTrackArtists,
  stripRemoteParentheses, display,
  onWriteTrackNamesChange, onTrackNameEnabledChange,
  onTrackArtistsEnabledChange, onEditedTrackNameChange, onEditedTrackArtistChange,
}: {
  matched: ReturnType<typeof matchTracks>;
  localTags: AlbumTags;
  writeTrackNames: boolean;
  writeTrackArtists: boolean;
  trackNameEnabled: Record<string, boolean>;
  trackArtistsEnabled: Record<string, boolean>;
  editedTrackNames: Record<string, string>;
  editedTrackArtists: Record<string, string>;
  stripRemoteParentheses: boolean;
  display: TrackDisplayConfig;
  onWriteTrackNamesChange: (enabled: boolean) => void;
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onTrackArtistsEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
  onEditedTrackArtistChange: (num: string, value: string) => void;
}) {
  return (
    <div className="col gap-xs">
      {matched.map((m) => {
        const nameEnabled = writeTrackNames && (trackNameEnabled[m.remote.num] !== false);
        const artistEnabled = writeTrackArtists && (trackArtistsEnabled[m.remote.num] === true);
        const displayName = editedTrackNames[m.remote.num] ?? m.remote.name;
        const rawArtist = editedTrackArtists[m.remote.num] ?? m.remote.artist;
        const displayArtist = stripRemoteParentheses ? stripParentheses(rawArtist) : rawArtist;

        const localArtist = m.local ? (localTags.trackArtists?.[m.local.file] || '') : '';
        const artistSim = localArtist && displayArtist ? similarity(localArtist, displayArtist) : 0;

        const callbacks: TrackCallbacks = {
          onPerTrackNameToggle: (num, enabled) => {
            onTrackNameEnabledChange(num, enabled);
            if (enabled && !writeTrackNames) onWriteTrackNamesChange(true);
          },
          onEditedTrackNameChange,
        };

        const groupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, opacity: nameEnabled ? 1 : 0.95 };

        return (
          <div key={m.remote.num} style={groupStyle}>
            <MatchRow
              m={m} localTags={localTags} display={display}
              track={{ nameEnabled, isNameEdited: m.remote.name !== displayName, isUnmatched: !m.local, displayName }}
              callbacks={callbacks}
            />
            <div className="tm-row">
              <div style={{ width: 11, flexShrink: 0 }} />
              <div style={{ width: 22, flexShrink: 0 }} />
              <div className="cell" style={{ flex: 1, minWidth: 0, color: '#fff7bb' }}>
                {m.local ? (
                  <span className="text-ellipsis" title={localTags.trackArtists?.[m.local.file] || ''}>
                    {localTags.trackArtists?.[m.local.file] || ''}
                  </span>
                ) : (
                  <span className="text-faint">&nbsp;</span>
                )}
              </div>
              <div style={{ width: 34, flexShrink: 0 }} />
              <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
                {m.local ? <SimPercent value={artistSim} /> : null}
              </div>
              <div style={{ width: 36, flexShrink: 0 }} />
              <div style={{ width: 22, flexShrink: 0 }} />
              <div className="cell" style={{ flex: 1, minWidth: 0 }}>
                <TrackArtistField value={displayArtist} onChange={(v) => {
                  onEditedTrackArtistChange(m.remote.num, v);
                  if (!artistEnabled) onTrackArtistsEnabledChange(m.remote.num, true);
                }} enabled={artistEnabled} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
