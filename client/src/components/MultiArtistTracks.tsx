import type { AlbumTags } from '../types';
import { matchTracks, stripParentheses } from '../utils';
import { FONT, FS, COLORS, simColor } from './styles';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                sc: simColor(m.sim),
              }}
              callbacks={callbacks}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '11px', marginTop: '-1px' }}>
              <span style={{ width: '11px', flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                {m.local ? (
                  <div title={localTags.trackArtists?.[m.local.file] || ''} className="text-ellipsis" style={{
                    fontSize: FS, fontFamily: FONT,
                    color: COLORS.textFaint,
                  }}>
                    {localTags.trackArtists?.[m.local.file] || ''}
                  </div>
                ) : (
                  <span style={{ fontSize: FS, color: COLORS.textInvisible }}>&nbsp;</span>
                )}
              </div>
              <span style={{ width: '36px', flexShrink: 0 }} />
              <span style={{ width: '40px', flexShrink: 0 }} />
              <span style={{ width: '36px', flexShrink: 0 }} />
              <div style={{ flex: 1, paddingLeft: '4px', minWidth: 0 }}>
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
