import { useMemo, useState } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { matchTracks, generateParsedTracks } from '../utils';
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
  onTrackNameEnabledBatchChange: (nums: string[], enabled: boolean) => void;
  onTrackArtistsEnabledChange: (num: string, enabled: boolean) => void;
  onTrackArtistsEnabledBatchChange: (nums: string[], enabled: boolean) => void;
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
  onTrackNameEnabledBatchChange,
  onTrackArtistsEnabledChange,
  onTrackArtistsEnabledBatchChange,
  onEditedTrackNameChange,
  onEditedTrackArtistChange,
  onCompilationChange,
  onStripRemoteParenthesesChange,
}: TrackMatcherProps) {
  const [showFilenamePreviews, setShowFilenamePreviews] = useState(false);
  const [filenameMode, setFilenameMode] = useState<'id3' | 'filename'>('id3');

  if (!localTags?.files) return null;

  const remoteTracks = useMemo(() => generateParsedTracks(albumDetails, localTags), [albumDetails, localTags]);
  const serverHasMultiArtist = useMemo(() => {
    const unique = new Set(remoteTracks.map(t => t.artist).filter(Boolean));
    return unique.size > 1;
  }, [remoteTracks]);
  const hasMultiArtist = compilation || serverHasMultiArtist;
  const matched = useMemo(() => matchTracks(remoteTracks, localTags.files!, localTags.trackTitles, false, filenameMode), [remoteTracks, localTags.files, localTags.trackTitles, filenameMode]);

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
    onTrackNameEnabledBatchChange(remoteTracks.map(t => t.num), enabled);
  };

  const handleArtistsToggle = (enabled: boolean) => {
    onWriteTrackArtistsChange(enabled);
    onTrackArtistsEnabledBatchChange(remoteTracks.map(t => t.num), enabled);
  };

  const display: TrackDisplayConfig = { filenameMode, showFilenamePreviews };

  return (
    <div className="panel">
      <div className="tm-toolbar">
          <label className="label-inline gap-xs">
            <input type="checkbox" className="cb" checked={writeTrackNames} onChange={(e) => handleTitlesToggle(e.target.checked)} />
            write track titles
          </label>
          <span className="tm-sep">·</span>
          <label className="label-inline gap-xs" style={{ opacity: hasAnyTags ? 1 : 0.3 }}>
            <input type="checkbox" className="cb" checked={showFilenamePreviews} onChange={(e) => setShowFilenamePreviews(e.target.checked)} disabled={!hasAnyTags} />
            filenames
          </label>
          <span className="tm-sep">·</span>
          <span>
            <span className={countMatch ? 'tm-count-match' : 'tm-count-mismatch'}>{localCount}</span>
            <span> / </span>
            <span className={countMatch ? 'tm-count-match' : 'tm-count-mismatch'}>{remoteCount}</span>
            <span> tracks</span>
          </span>
          {exactCount > 0 && <span className="tm-stat-exact">{exactCount} exact</span>}
          {closeCount > 0 && <span className="tm-stat-close">{closeCount} close</span>}
          {missingCount > 0 && <span className="tm-stat-missing">{missingCount} missing</span>}
          {extraCount > 0 && <span className="tm-stat-extra">{extraCount} extra</span>}
          <span className="tm-sep">·</span>
          <span className="row gap-md">
            <label className="label-inline gap-xs">
              <input type="radio" className="cb" name="filenameMode" checked={filenameMode === 'id3'} onChange={() => setFilenameMode('id3')} />
              ID3
            </label>
            <label className="label-inline gap-xs">
              <input type="radio" className="cb" name="filenameMode" checked={filenameMode === 'filename'} onChange={() => setFilenameMode('filename')} />
              filename
            </label>
          </span>
          <span className="tm-sep">·</span>
          <label className="label-inline gap-xs">
            <input type="checkbox" className="cb" checked={hasMultiArtist} onChange={(e) => onCompilationChange(e.target.checked)} />
            multi-artist
          </label>
          <span className="tm-sep">·</span>
          <label className="label-inline gap-xs">
            <input type="checkbox" className="cb" checked={stripRemoteParentheses} onChange={(e) => onStripRemoteParenthesesChange(e.target.checked)} />
            strip parens
          </label>
          {hasMultiArtist && (
            <>
              <span className="tm-sep">·</span>
              <label className="label-inline gap-xs">
                <input type="checkbox" className="cb" checked={writeTrackArtists} onChange={(e) => handleArtistsToggle(e.target.checked)} />
                artists
              </label>
            </>
          )}
          {localTags.bitrateInfo && (
            <span className="tm-bitrate">{localTags.bitrateInfo}</span>
          )}
      </div>

      {hasMultiArtist ? (
        <MultiArtistTracks
          matched={matched} localTags={localTags} writeTrackNames={writeTrackNames} writeTrackArtists={writeTrackArtists}
          trackNameEnabled={trackNameEnabled} trackArtistsEnabled={trackArtistsEnabled} editedTrackNames={editedTrackNames} editedTrackArtists={editedTrackArtists}
          stripRemoteParentheses={stripRemoteParentheses} display={display}
          onWriteTrackNamesChange={onWriteTrackNamesChange}
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
