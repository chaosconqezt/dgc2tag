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
    <div className="col gap-sm">
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
          <div key={m.remote.num} style={{ opacity: nameEnabled ? 1 : 0.95 }}>
            <MatchRow
              m={m}
              localTags={localTags}
              display={display}
              track={{
                nameEnabled,
                isNameEdited: m.remote.name !== displayName,
                isUnmatched: !m.local,
                displayName,
              }}
              callbacks={callbacks}
            />

            <div className="mr-artist-row">
              <span className="mr-check" />
              <span className="mr-cell-num" />
              <div className="t-cell mr-artist-local">
                {m.local ? (
                  <span title={localTags.trackArtists?.[m.local.file] || ''} className="text-ellipsis">
                    {localTags.trackArtists?.[m.local.file] || ''}
                  </span>
                ) : (
                  <span className="mr-artist-empty">&nbsp;</span>
                )}
              </div>
              <span className="mr-duration" />
              <span className="mr-sim" />
              <span className="mr-remote-duration" />
              <span className="mr-cell-num" />
              <div className="t-cell mr-edit">
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
