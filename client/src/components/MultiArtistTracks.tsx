import type { AlbumTags } from '../types';
import { matchTracks, stripParentheses } from '../utils';
import { MatchRow, type TrackDisplayConfig, type TrackCallbacks } from './MatchRow';
import { TrackArtistField } from './TrackArtistField';

export function MultiArtistTracks({
  matched,
  localTags,
  writeTrackNames,
  writeTrackArtists,
  trackNameEnabled,
  trackArtistsEnabled,
  editedTrackNames,
  editedTrackArtists,
  stripRemoteParentheses,
  display,
  onWriteTrackNamesChange,
  onTrackNameEnabledChange,
  onTrackArtistsEnabledChange,
  onEditedTrackNameChange,
  onEditedTrackArtistChange,
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
    <div className="track-list">
      {matched.map((m) => {
        const nameEnabled = writeTrackNames && (trackNameEnabled[m.remote.num] !== false);
        const artistEnabled = writeTrackArtists && (trackArtistsEnabled[m.remote.num] === true);
        const displayName = editedTrackNames[m.remote.num] ?? m.remote.name;
        const rawArtist = editedTrackArtists[m.remote.num] ?? m.remote.artist;
        const displayArtist = stripRemoteParentheses ? stripParentheses(rawArtist) : rawArtist;

        const callbacks: TrackCallbacks = {
          onPerTrackNameToggle: (num, enabled) => {
            onTrackNameEnabledChange(num, enabled);
            if (enabled && !writeTrackNames) onWriteTrackNamesChange(true);
          },
          onEditedTrackNameChange,
        };

        return (
          <div key={m.remote.num}>
            <MatchRow
              m={m}
              localTags={localTags}
              display={display}
              track={{
                nameEnabled,
                isNameEdited: m.remote.name !== displayName,
                isUnmatched: !m.local,
                displayName,
                simClass: m.sim === 100 ? 'green' : m.sim >= 80 ? 'yellow' : 'red',
              }}
              callbacks={callbacks}
            />

            <div className="track-artist-row">
              <span />
              <span />
              <div className="track-artist-cell">
                {m.local ? (
                  <span title={localTags.trackArtists?.[m.local.file] || ''}>
                    {localTags.trackArtists?.[m.local.file] || ''}
                  </span>
                ) : (
                  <span className="track-artist-spacer">&nbsp;</span>
                )}
              </div>
              <span />
              <span />
              <span />
              <span />
              <div className="track-artist-cell right">
                <TrackArtistField
                  value={displayArtist}
                  onChange={(v) => {
                    onEditedTrackArtistChange(m.remote.num, v);
                    if (!artistEnabled) onTrackArtistsEnabledChange(m.remote.num, true);
                  }}
                  enabled={artistEnabled}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
