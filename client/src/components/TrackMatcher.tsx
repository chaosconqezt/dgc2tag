import { useState } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { matchTracks } from '../utils';
import { FONT, FS, COLORS, CHECKBOX, INPUT_STYLE, simColor, PANEL_STYLE } from './styles';

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

function TrackArtistField({
  value,
  onChange,
  enabled,
}: {
  value: string;
  onChange: (v: string) => void;
  enabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: FS,
        fontFamily: FONT,
        color: enabled ? COLORS.textMuted : COLORS.textFaint,
        cursor: editing ? 'text' : 'pointer',
        padding: 0,
        borderRadius: 0,
        border: 'none',
        background: 'transparent',
        minWidth: '20px',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim() && draft !== value) {
              onChange(draft.trim());
            } else {
              setDraft(value);
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (draft.trim() && draft !== value) {
                onChange(draft.trim());
              } else {
                setDraft(value);
              }
              setEditing(false);
            }
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          style={{
            ...INPUT_STYLE,
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            padding: 0,
            width: '100%',
            minWidth: '30px',
          }}
        />
      ) : (
        <span
          onClick={() => { setDraft(value); setEditing(true); }}
          title={value}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >{value || '—'}</span>
      )}
    </div>
  );
}

function stripParentheses(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function MatchRow({
  m,
  localTags,
  filenameMode,
  showFilenamePreviews,
  nameEnabled,
  artistEnabled,
  isNameEdited,
  isUnmatched,
  displayName,
  displayArtist,
  sc,
  onPerTrackNameToggle,
  onEditedTrackNameChange,
  onEditedTrackArtistChange,
  onPerTrackArtistToggle,
}: {
  m: ReturnType<typeof matchTracks>[number];
  localTags: AlbumTags;
  filenameMode: 'id3' | 'filename';
  showFilenamePreviews: boolean;
  nameEnabled: boolean;
  artistEnabled: boolean;
  isNameEdited: boolean;
  isUnmatched: boolean;
  displayName: string;
  displayArtist: string;
  sc: string;
  onPerTrackNameToggle: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
  onEditedTrackArtistChange: (num: string, value: string) => void;
  onPerTrackArtistToggle: (num: string, enabled: boolean) => void;
}) {
  const localLabel = m.local
    ? filenameMode === 'filename' ? m.local.file : m.local.name
    : '';

  const localDuration = m.local ? localTags.trackDurations?.[m.local.file] : undefined;
  const remoteDuration = m.remote.duration;
  const displayDuration = localDuration || remoteDuration;

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
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.inputBg)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* checkbox column */}
      <div style={{ width: '11px', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={nameEnabled}
          onChange={(e) => onPerTrackNameToggle(m.remote.num, e.target.checked)}
          title={nameEnabled ? 'Writing this track name — click to skip' : 'Skipping this track name — click to include'}
          style={{ ...CHECKBOX, cursor: 'pointer' }}
        />
      </div>

      {/* left side: from tag (name) */}
      <div style={{ flex: 1, textAlign: 'left', paddingLeft: '4px', minWidth: 0 }}>
        {m.local ? (
          <>
            <div title={localLabel} style={{
              fontSize: FS, fontFamily: FONT,
              color: COLORS.textMuted,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: '12px', color: COLORS.textFaint, fontFamily: 'monospace', marginRight: '4px' }}>{m.local.num || '?'}</span>
              {localLabel || '—'}
            </div>
            {showFilenamePreviews && m.local && filenameMode === 'id3' && m.local.file !== m.local.name && (
              <div title={m.local.file} style={{
                fontSize: FS, fontFamily: FONT,
                color: COLORS.textFaint,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {m.local.file || ''}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: FS, fontFamily: FONT, color: COLORS.textInvisible, fontStyle: 'italic' }}>unmatched</div>
        )}
      </div>

      {/* local duration */}
      <div style={{ width: '36px', textAlign: 'right', flexShrink: 0, fontSize: FS, fontFamily: 'monospace', color: COLORS.textMuted }}>
        {formatDuration(displayDuration)}
      </div>

      {/* similarity */}
      <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
        {m.local ? (
          <span style={{ fontSize: FS, fontWeight: '600', fontFamily: 'monospace', color: sc }}>{m.sim}%</span>
        ) : (
          <span style={{ fontSize: FS, color: COLORS.textInvisible }}>—</span>
        )}
      </div>

      {/* remote duration */}
      <div style={{ width: '36px', textAlign: 'left', flexShrink: 0, fontSize: FS, fontFamily: 'monospace', color: remoteDuration ? COLORS.textMuted : COLORS.textInvisible }}>
        {formatDuration(remoteDuration)}
      </div>

      {/* right side: from catalog (name editable) */}
      <div style={{ flex: 1, paddingLeft: '4px', minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: COLORS.textFaint, fontFamily: 'monospace', flexShrink: 0 }}>{m.remote.num}</span>
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

function SingleArtistTracks({
  matched,
  localTags,
  writeTrackNames,
  trackNameEnabled,
  editedTrackNames,
  showFilenamePreviews,
  filenameMode,
  onWriteTrackNamesChange,
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
  onWriteTrackNamesChange: (enabled: boolean) => void;
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>

      {matched.map((m, i) => {
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
            artistEnabled={false}
            isNameEdited={isNameEdited}
            isUnmatched={isUnmatched}
            displayName={displayName}
            displayArtist=""
            sc={sc}
            onPerTrackNameToggle={(num, enabled) => onTrackNameEnabledChange(num, enabled)}
            onEditedTrackNameChange={onEditedTrackNameChange}
            onEditedTrackArtistChange={() => {}}
            onPerTrackArtistToggle={() => {}}
          />
        );
      })}
    </div>
  );
}

function MultiArtistTracks({
  matched,
  localTags,
  writeTrackNames,
  writeTrackArtists,
  trackNameEnabled,
  trackArtistsEnabled,
  editedTrackNames,
  editedTrackArtists,
  stripRemoteParentheses,
  showFilenamePreviews,
  filenameMode,
  onWriteTrackNamesChange,
  onWriteTrackArtistsChange,
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
  showFilenamePreviews: boolean;
  filenameMode: 'id3' | 'filename';
  onWriteTrackNamesChange: (enabled: boolean) => void;
  onWriteTrackArtistsChange: (enabled: boolean) => void;
  onTrackNameEnabledChange: (num: string, enabled: boolean) => void;
  onTrackArtistsEnabledChange: (num: string, enabled: boolean) => void;
  onEditedTrackNameChange: (num: string, value: string) => void;
  onEditedTrackArtistChange: (num: string, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

      {matched.map((m, i) => {
        const nameEnabled = writeTrackNames && (trackNameEnabled[m.remote.num] !== false);
        const artistEnabled = writeTrackArtists && (trackArtistsEnabled[m.remote.num] === true);
        const isUnmatched = !m.local;
        const displayName = editedTrackNames[m.remote.num] ?? m.remote.name;
        const isNameEdited = m.remote.name !== displayName;
        const rawArtist = editedTrackArtists[m.remote.num] ?? m.remote.artist;
        const displayArtist = stripRemoteParentheses ? stripParentheses(rawArtist) : rawArtist;
        const sc = simColor(m.sim);

        return (
          <div key={m.remote.num} style={{ opacity: nameEnabled ? 1 : 0.95 }}>
            <MatchRow
              m={m}
              localTags={localTags}
              filenameMode={filenameMode}
              showFilenamePreviews={showFilenamePreviews}
              nameEnabled={nameEnabled}
              artistEnabled={false}
              isNameEdited={isNameEdited}
              isUnmatched={isUnmatched}
              displayName={displayName}
              displayArtist=""
              sc={sc}
              onPerTrackNameToggle={(num, enabled) => {
                onTrackNameEnabledChange(num, enabled);
                if (enabled && !writeTrackNames) onWriteTrackNamesChange(true);
              }}
              onEditedTrackNameChange={onEditedTrackNameChange}
              onEditedTrackArtistChange={() => {}}
              onPerTrackArtistToggle={() => {}}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '11px', marginTop: '-1px' }}>
              <span style={{ width: '11px', flexShrink: 0 }} />

              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                {m.local ? (
                  <div title={localTags.trackArtists?.[m.local.file] || ''} style={{
                    fontSize: FS, fontFamily: FONT,
                    color: COLORS.textFaint,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
  onStripRemoteParenthesesChange,
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

  if (!localTags?.files) {
    return null;
  }

  // When no albumDetails, generate parsedTracks from local tags
  const remoteTracks = albumDetails?.parsedTracks ?? localTags.files.map((filePath, i) => {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const numMatch = fileName.match(/^(\d{1,3})/);
    const num = numMatch?.[1] || String(i + 1).padStart(2, '0');
    const artist = localTags.trackArtists?.[filePath] || localTags.artist || '';
    const name = localTags.trackTitles?.[filePath] || fileName.replace(/^\d+[\.\s)]*\s*/, '').replace(/\.mp3$/i, '');
    return { num, artist, name };
  });
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
    remoteTracks.forEach(t => {
      onTrackNameEnabledChange(t.num, enabled);
    });
  };

  const handleArtistsToggle = (enabled: boolean) => {
    onWriteTrackArtistsChange(enabled);
    remoteTracks.forEach(t => {
      onTrackArtistsEnabledChange(t.num, enabled);
    });
  };

  return (
    <div style={PANEL_STYLE}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: FS, fontFamily: FONT, color: COLORS.textDim, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <input type="checkbox" checked={writeTrackNames}
            onChange={(e) => handleTitlesToggle(e.target.checked)}
            style={CHECKBOX}
          />
          write track titles
        </label>
        <span style={{ color: COLORS.textInvisible }}>·</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', opacity: hasAnyTags ? 1 : 0.3 }}>
          <input type="checkbox" checked={showFilenamePreviews}
            onChange={(e) => setShowFilenamePreviews(e.target.checked)}
            disabled={!hasAnyTags}
            style={CHECKBOX}
          />
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
            <input type="radio" name="filenameMode" checked={filenameMode === 'id3'}
              onChange={() => setFilenameMode('id3')}
              style={CHECKBOX}
            />
            ID3
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <input type="radio" name="filenameMode" checked={filenameMode === 'filename'}
              onChange={() => setFilenameMode('filename')}
              style={CHECKBOX}
            />
            filename
          </label>
        </span>
        <span style={{ color: COLORS.textInvisible }}>·</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <input type="checkbox" checked={compilation}
            onChange={(e) => onCompilationChange(e.target.checked)}
            style={CHECKBOX}
          />
          compilation
        </label>
        {hasMultiArtist && (
          <>
            <span style={{ color: COLORS.textInvisible }}>·</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input type="checkbox" checked={writeTrackArtists}
                onChange={(e) => handleArtistsToggle(e.target.checked)}
                style={CHECKBOX}
              />
              artists
            </label>
          </>
        )}
      </div>

      {/* Track list — single or multi artist mode */}
      {hasMultiArtist ? (
        <MultiArtistTracks
          matched={matched}
          localTags={localTags}
          writeTrackNames={writeTrackNames}
          writeTrackArtists={writeTrackArtists}
          trackNameEnabled={trackNameEnabled}
          trackArtistsEnabled={trackArtistsEnabled}
          editedTrackNames={editedTrackNames}
          editedTrackArtists={editedTrackArtists}
          stripRemoteParentheses={stripRemoteParentheses}
          showFilenamePreviews={showFilenamePreviews}
          filenameMode={filenameMode}
          onWriteTrackNamesChange={onWriteTrackNamesChange}
          onWriteTrackArtistsChange={onWriteTrackArtistsChange}
          onTrackNameEnabledChange={onTrackNameEnabledChange}
          onTrackArtistsEnabledChange={onTrackArtistsEnabledChange}
          onEditedTrackNameChange={onEditedTrackNameChange}
          onEditedTrackArtistChange={onEditedTrackArtistChange}
        />
      ) : (
        <SingleArtistTracks
          matched={matched}
          localTags={localTags}
          writeTrackNames={writeTrackNames}
          trackNameEnabled={trackNameEnabled}
          editedTrackNames={editedTrackNames}
          showFilenamePreviews={showFilenamePreviews}
          filenameMode={filenameMode}
          onWriteTrackNamesChange={onWriteTrackNamesChange}
          onTrackNameEnabledChange={onTrackNameEnabledChange}
          onEditedTrackNameChange={onEditedTrackNameChange}
        />
      )}
    </div>
  );
}
