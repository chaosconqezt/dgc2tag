import { useState } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { matchTracks, generateParsedTracks } from '../utils';
import { FONT, FS, COLORS, CHECKBOX, PANEL_STYLE } from './styles';
import { SingleArtistTracks } from './SingleArtistTracks';
import { MultiArtistTracks } from './MultiArtistTracks';
import type { TrackDisplayConfig } from './MatchRow';

interface TrackMatcherProps {
  albumDetails: SearchResult | null;
  localTags: AlbumTags | null;
  writeTrackNames: boolean;
  writeTrackArtists: boolean;
  trackNameEnabled: Record<string, boolean>;
  trackArtistsEnabled: Record<string, boolean>;
  editedTrackNames: Record<string, string>;
  editedTrackArtists: Record<string, string>;
  stripRemoteParentheses: boolean;
  compilation: boolean;
  onStripRemoteParenthesesChange: (enabled: boolean) => void;
  onWriteTrackNamesChange: (enabled: boolean) => void;
  onWriteTrackArtistsChange: (enabled: boolean) => void;
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onTrackArtistsEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
  onEditedTrackArtistChange: (num: string, value: string) => void;
  onCompilationChange: (enabled: boolean) => void;
}

export function TrackMatcher({
  albumDetails,
  localTags,
  writeTrackNames,
  writeTrackArtists,
  trackNameEnabled,
  trackArtistsEnabled,
  editedTrackNames,
  editedTrackArtists,
  stripRemoteParentheses,
  compilation,
  onWriteTrackNamesChange,
  onWriteTrackArtistsChange,
  onTrackNameEnabledChange,
  onTrackArtistsEnabledChange,
  onEditedTrackNameChange,
  onEditedTrackArtistChange,
  onCompilationChange,
}: TrackMatcherProps) {
  const [showFilenamePreviews, setShowFilenamePreviews] = useState(false);
  const [filenameMode, setFilenameMode] = useState<'id3' | 'filename'>('id3');

  if (!localTags?.files) return null;

  const remoteTracks = generateParsedTracks(albumDetails, localTags);
  const artists = [...new Set(remoteTracks.map(t => t.artist))];
  const hasMultiArtist = compilation || artists.length > 1;
  const matched = matchTracks(remoteTracks, localTags.files, localTags.trackTitles, false, filenameMode);

  const localCount = localTags.files.length;
  const remoteCount = remoteTracks.length;
  const countMatch = localCount === remoteCount;
  const exactCount = matched.filter(m => m.sim === 100).length;
  const closeCount = matched.filter(m => m.sim >= 80 && m.sim < 100).length;
  const missingCount = matched.filter(m => !m.local).length;
  const extraCount = localCount - matched.filter(m => m.local).length;
  const hasAnyTags = localTags.trackTitles && Object.keys(localTags.trackTitles).length > 0;

  const handleTitlesToggle = (enabled: boolean) => {
    onWriteTrackNamesChange(enabled);
    remoteTracks.forEach(t => onTrackNameEnabledChange(t.num, enabled));
  };

  const handleArtistsToggle = (enabled: boolean) => {
    onWriteTrackArtistsChange(enabled);
    remoteTracks.forEach(t => onTrackArtistsEnabledChange(t.num, enabled));
  };

  const display: TrackDisplayConfig = { filenameMode, showFilenamePreviews };

  return (
    <div style={PANEL_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: FS, fontFamily: FONT, color: COLORS.textDim, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={writeTrackNames} onChange={(e) => handleTitlesToggle(e.target.checked)} style={CHECKBOX} />
            write track titles
          </label>
          <span style={{ color: COLORS.textInvisible }}>·</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', opacity: hasAnyTags ? 1 : 0.3 }}>
            <input type="checkbox" checked={showFilenamePreviews} onChange={(e) => setShowFilenamePreviews(e.target.checked)} disabled={!hasAnyTags} style={CHECKBOX} />
            filenames
          </label>
          <span style={{ color: COLORS.textInvisible }}>·</span>
          <span>
            <span style={{ color: countMatch ? COLORS.green : COLORS.yellow, fontWeight: '600' }}>{localCount}</span>
            <span> / </span>
            <span style={{ color: countMatch ? COLORS.green : COLORS.yellow, fontWeight: '600' }}>{remoteCount}</span>
            <span> tracks</span>
          </span>
          {exactCount > 0 && <span style={{ color: COLORS.green }}>{exactCount} exact</span>}
          {closeCount > 0 && <span style={{ color: COLORS.yellow }}>{closeCount} close</span>}
          {missingCount > 0 && <span style={{ color: COLORS.red }}>{missingCount} missing</span>}
          {extraCount > 0 && <span style={{ color: COLORS.yellow }}>{extraCount} extra</span>}
          <span style={{ color: COLORS.textInvisible }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input type="radio" name="filenameMode" checked={filenameMode === 'id3'} onChange={() => setFilenameMode('id3')} style={CHECKBOX} />
              ID3
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input type="radio" name="filenameMode" checked={filenameMode === 'filename'} onChange={() => setFilenameMode('filename')} style={CHECKBOX} />
              filename
            </label>
          </span>
          <span style={{ color: COLORS.textInvisible }}>·</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="checkbox" checked={compilation} onChange={(e) => onCompilationChange(e.target.checked)} style={CHECKBOX} />
            compilation
          </label>
          {hasMultiArtist && (
            <>
              <span style={{ color: COLORS.textInvisible }}>·</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                <input type="checkbox" checked={writeTrackArtists} onChange={(e) => handleArtistsToggle(e.target.checked)} style={CHECKBOX} />
                artists
              </label>
            </>
          )}
          {localTags.bitrateInfo && (
            <span style={{ marginLeft: 'auto', color: COLORS.textFaint }}>
              {localTags.bitrateInfo}
            </span>
          )}
      </div>

      {hasMultiArtist ? (
        <MultiArtistTracks
          matched={matched} localTags={localTags} writeTrackNames={writeTrackNames} writeTrackArtists={writeTrackArtists}
          trackNameEnabled={trackNameEnabled} trackArtistsEnabled={trackArtistsEnabled} editedTrackNames={editedTrackNames} editedTrackArtists={editedTrackArtists}
          stripRemoteParentheses={stripRemoteParentheses} display={display}
          onWriteTrackNamesChange={onWriteTrackNamesChange} onWriteTrackArtistsChange={onWriteTrackArtistsChange}
          onTrackNameEnabledChange={onTrackNameEnabledChange} onTrackArtistsEnabledChange={onTrackArtistsEnabledChange}
          onEditedTrackNameChange={onEditedTrackNameChange} onEditedTrackArtistChange={onEditedTrackArtistChange}
        />
      ) : (
        <SingleArtistTracks
          matched={matched} localTags={localTags} writeTrackNames={writeTrackNames}
          trackNameEnabled={trackNameEnabled} editedTrackNames={editedTrackNames}
          display={display}
          onTrackNameEnabledChange={onTrackNameEnabledChange} onEditedTrackNameChange={onEditedTrackNameChange}
        />
      )}
    </div>
  );
}
