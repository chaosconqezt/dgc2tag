import type { AlbumTags } from '../types';
import { matchTracks } from '../utils';
import { simColor } from './styles';
import { MatchRow } from './MatchRow';

export function SingleArtistTracks({
  matched,
  localTags,
  writeTrackNames,
  trackNameEnabled,
  editedTrackNames,
  showFilenamePreviews,
  filenameMode,
  onTrackNameEnabledChange,
  onEditedTrackNameChange,
}: {
  matched: ReturnType<typeof matchTracks>;
  localTags: AlbumTags;
  writeTrackNames: boolean;
  trackNameEnabled: Record<string, boolean>;
  editedTrackNames: Record<string, string>;
  showFilenamePreviews: boolean;
  filenameMode: 'id3' | 'filename';
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {matched.map((m) => {
        const nameEnabled = writeTrackNames && (trackNameEnabled[m.remote.num] !== false);
        const isUnmatched = !m.local;
        const displayName = editedTrackNames[m.remote.num] ?? m.remote.name;
        const isNameEdited = m.remote.name !== displayName;
        const sc = simColor(m.sim);

        return (
          <MatchRow
            key={m.remote.num}
            m={m}
            localTags={localTags}
            filenameMode={filenameMode}
            showFilenamePreviews={showFilenamePreviews}
            nameEnabled={nameEnabled}
            isNameEdited={isNameEdited}
            isUnmatched={isUnmatched}
            displayName={displayName}
            sc={sc}
            onPerTrackNameToggle={(num, enabled) => onTrackNameEnabledChange(num, enabled)}
            onEditedTrackNameChange={onEditedTrackNameChange}
          />
        );
      })}
    </div>
  );
}
