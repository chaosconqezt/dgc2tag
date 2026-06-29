import type { AlbumTags } from '../types';
import { matchTracks } from '../utils';
import { MatchRow, type TrackDisplayConfig, type TrackCallbacks } from './MatchRow';

export function SingleArtistTracks({
  matched,
  localTags,
  writeTrackNames,
  trackNameEnabled,
  editedTrackNames,
  display,
  onTrackNameEnabledChange,
  onEditedTrackNameChange,
}: {
  matched: ReturnType<typeof matchTracks>;
  localTags: AlbumTags;
  writeTrackNames: boolean;
  trackNameEnabled: Record<string, boolean>;
  editedTrackNames: Record<string, string>;
  display: TrackDisplayConfig;
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
}) {
  const callbacks: TrackCallbacks = {
    onPerTrackNameToggle: (num, enabled) => onTrackNameEnabledChange(num, enabled),
    onEditedTrackNameChange,
  };

  return (
    <div className="col gap-xs">
      {matched.map((m) => {
        const nameEnabled = writeTrackNames && (trackNameEnabled[m.remote.num] !== false);
        const displayName = editedTrackNames[m.remote.num] ?? m.remote.name;

        return (
          <MatchRow
            key={m.remote.num}
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
        );
      })}
    </div>
  );
}
