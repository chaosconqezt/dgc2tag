import { useMemo } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { similarity } from '../utils';
import { FONT, FS, COLORS, CHECKBOX, CELL_STYLE, INPUT_STYLE, PERCENT_STYLE, HEADER_STYLE, PANEL_STYLE, GRID_STYLE, ROW_STYLE } from './styles';

interface TagComparisonProps {
  selectedResult: SearchResult | null;
  localTags: AlbumTags | null;
  tagEnabled: Record<string, boolean>;
  editedSiteValues: Record<string, string>;
  stripRemoteParentheses: boolean;
  onTagEnabledChange: (key: string, enabled: boolean) => void;
  onEditedSiteValuesChange: (key: string, value: string) => void;
}

function formatReleaseType(val: string): string {
  if (!val) return val;
  if (val.toLowerCase() === 'ep') return 'EP';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

export function TagComparison({
  selectedResult,
  localTags,
  tagEnabled,
  editedSiteValues,
  stripRemoteParentheses,
  onTagEnabledChange,
  onEditedSiteValuesChange,
}: TagComparisonProps) {
  if (!selectedResult && !localTags) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: COLORS.textInvisible, opacity: 0.5 }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>&#9776;</div>
        <p style={{ fontWeight: '500', fontSize: FS, fontFamily: FONT }}>Select a folder with MP3 files</p>
      </div>
    );
  }

  const isDeezer = selectedResult ? selectedResult.postId < 0 : false;
  const deezerId = isDeezer && selectedResult ? Math.abs(selectedResult.postId) : null;

  // When no search result, local tags become the source for the site column
  const rawArtist = selectedResult
    ? (stripRemoteParentheses ? selectedResult.artist.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : selectedResult.artist)
    : (localTags?.artists?.[0] || localTags?.artist || '');
  const rawAlbumArtist = selectedResult
    ? (stripRemoteParentheses ? selectedResult.albumArtist.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : selectedResult.albumArtist)
    : (localTags?.albumArtist || localTags?.artist || '');

  const fields = [
    { key: 'artist', label: 'Artist', file: localTags?.artists && localTags.artists.length > 0 ? localTags.artists : null, site: rawArtist },
    { key: 'albumArtist', label: 'Album Artist', file: localTags?.albumArtist || localTags?.artist, site: rawAlbumArtist },
    { key: 'album', label: 'Album', file: localTags?.album, site: selectedResult?.albumName ?? localTags?.album ?? '' },
    { key: 'year', label: 'Year', file: localTags?.year, site: selectedResult?.year ?? localTags?.year ?? '' },
    { key: 'genre', label: 'Genre', file: localTags?.genre, site: selectedResult?.genres?.join(', ') ?? localTags?.genre ?? '' },
    { key: 'country', label: 'Country', file: localTags?.country, site: selectedResult?.country ?? localTags?.country ?? '' },
    { key: 'label', label: 'Label', file: localTags?.label, site: selectedResult?.label ?? localTags?.label ?? '' },
    { key: 'releaseType', label: 'Type', file: localTags?.releaseType, site: selectedResult?.releaseType ?? localTags?.releaseType ?? '' },
  ];

  const dgcPostId = localTags?.postId != null ? String(localTags.postId) : null;
  const dzDeezerId = localTags?.deezerId != null ? String(localTags.deezerId) : null;
  const siteDgcId = selectedResult && !isDeezer && selectedResult.postId > 0 ? String(selectedResult.postId) : null;
  const siteDeezerId = deezerId != null ? String(deezerId) : null;

  // Memoize similarity computation for all fields
  const fieldSims = useMemo(() => {
    const sims: Record<string, number> = {};
    for (const f of fields) {
      if (!f.file || !f.site) {
        sims[f.key] = 0;
        continue;
      }
      let compareVal: string;
      if (f.key === 'artist' && Array.isArray(f.file)) {
        compareVal = f.file[0] || '';
      } else {
        compareVal = String(f.file);
      }
      const a = compareVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      const b = (f.site || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      sims[f.key] = a === b ? 100 : (a && b) ? similarity(compareVal, f.site || '') : 0;
    }
    return sims;
  }, [fields]);

  const renderLocalValue = (file: string[] | string | null | undefined, key: string) => {
    if (key === 'artist' && Array.isArray(file)) {
      if (file.length === 0) return <span style={{ color: COLORS.textInvisible }}>—</span>;
      if (file.length === 1) return (
        <div style={{ fontSize: FS, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
          {file[0]}
        </div>
      );
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {file.map((val, i) => (
            <div key={i} style={{ fontSize: FS, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
              {val}
            </div>
          ))}
        </div>
      );
    }
    if (!file) return <span style={{ color: COLORS.textInvisible }}>—</span>;
    return (
      <div style={{ fontSize: FS, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
        {String(file)}
      </div>
    );
  };

  return (
    <div style={PANEL_STYLE}>
      <div style={HEADER_STYLE}>
        <span style={{ color: isDeezer ? '#4ade80' : COLORS.text, fontWeight: '600', fontSize: FS, fontFamily: FONT }}>
          {isDeezer ? 'DEEZER · TAG COMPARISON' : selectedResult ? 'TAG COMPARISON' : 'LOCAL TAGS'}
        </span>
      </div>

      <div>
        {fields.map((f) => {
          const rawSiteVal = editedSiteValues[f.key] !== undefined ? editedSiteValues[f.key] : (f.site || '');
          const siteVal = f.key === 'releaseType' ? formatReleaseType(rawSiteVal) : rawSiteVal;
          const sim = fieldSims[f.key];
          const isDifferent = f.key === 'artist' && Array.isArray(f.file)
            ? true
            : String(f.file) !== rawSiteVal;
          const enabled = tagEnabled[f.key] !== false;
          const readonly = 'readonly' in f && (f as { readonly?: boolean }).readonly === true;

          return (
            <div key={f.key} style={ROW_STYLE(enabled)}>
              <div style={GRID_STYLE}>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={readonly}
                  onChange={(e) => onTagEnabledChange(f.key, e.target.checked)}
                  title={readonly ? `${f.label} — read only` : (enabled ? `Writing ${f.label} tag — click to skip` : `Skipping ${f.label} tag — click to include`)}
                  style={{ ...CHECKBOX, justifySelf: 'center', opacity: readonly ? 0.3 : 1 }}
                />
                <div style={{ ...CELL_STYLE, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderLocalValue(f.file, f.key)}
                  </span>
                  <span style={{ fontSize: FS, color: COLORS.textFaint, opacity: 0.5, whiteSpace: 'nowrap', fontFamily: FONT, marginLeft: '4px', flexShrink: 0 }}>{f.label}</span>
                </div>
                <div style={{ ...PERCENT_STYLE }}>
                  {readonly ? '' : `${sim}%`}
                </div>
                <input
                  type="text"
                  value={siteVal}
                  readOnly={readonly}
                  onChange={(e) => onEditedSiteValuesChange(f.key, e.target.value)}
                  style={{
                    ...INPUT_STYLE,
                    color: readonly ? COLORS.textDim : (isDifferent ? COLORS.green : COLORS.textMuted),
                    backgroundColor: readonly ? 'transparent' : (isDifferent ? COLORS.greenBg : COLORS.inputBg),
                    fontWeight: readonly ? '400' : (isDifferent ? '600' : '400'),
                    border: readonly ? 'none' : (isDifferent ? `1px solid ${COLORS.greenBorder}` : `1px solid ${COLORS.borderLight}`),
                    cursor: readonly ? 'default' : 'text',
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* IDs row: DGC + Deezer side by side */}
        <div style={ROW_STYLE(true)}>
          <div style={{ display: 'grid', gridTemplateColumns: '11px 1fr 40px 1fr', gap: '4px', alignItems: 'center' }}>
            <input type="checkbox" checked disabled readOnly style={{ ...CHECKBOX, justifySelf: 'center', opacity: 0.3 }} />
            <div style={{ ...CELL_STYLE, display: 'flex', gap: '4px' }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: FS, color: COLORS.textFaint, opacity: 0.5, fontFamily: FONT, flexShrink: 0 }}>DGC</span>
                <span style={{ fontSize: FS, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                  {dgcPostId || <span style={{ color: COLORS.textInvisible }}>—</span>}
                </span>
              </span>
              <span style={{ width: '1px', background: COLORS.borderLight, alignSelf: 'stretch' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: FS, color: COLORS.textFaint, opacity: 0.5, fontFamily: FONT, flexShrink: 0 }}>DZ</span>
                <span style={{ fontSize: FS, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                  {dzDeezerId || <span style={{ color: COLORS.textInvisible }}>—</span>}
                </span>
              </span>
            </div>
            <div style={PERCENT_STYLE}></div>
            <div style={{ ...INPUT_STYLE, display: 'flex', gap: '4px', color: COLORS.textMuted, backgroundColor: COLORS.inputBg, border: `1px solid ${COLORS.borderLight}` }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: FS, color: COLORS.textFaint, opacity: 0.5, fontFamily: FONT, flexShrink: 0 }}>DGC</span>
                <span style={{ fontSize: FS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                  {siteDgcId || <span style={{ color: COLORS.textInvisible }}>—</span>}
                </span>
              </span>
              <span style={{ width: '1px', background: COLORS.borderLight, alignSelf: 'stretch' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: FS, color: COLORS.textFaint, opacity: 0.5, fontFamily: FONT, flexShrink: 0 }}>DZ</span>
                <span style={{ fontSize: FS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                  {siteDeezerId || <span style={{ color: COLORS.textInvisible }}>—</span>}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
