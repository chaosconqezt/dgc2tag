import { useMemo, useState } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { similarity } from '../utils';

interface TagComparisonProps {
  selectedResult: SearchResult | null;
  localTags: AlbumTags | null;
  tagEnabled: Record<string, boolean>;
  editedSiteValues: Record<string, string>;
  editedExtraTags: Record<string, string>;
  stripRemoteParentheses: boolean;
  onTagEnabledChange: (key: string, enabled: boolean) => void;
  onEditedSiteValuesChange: (key: string, value: string) => void;
  onEditedExtraTagChange: (key: string, value: string) => void;
  onClearAllExtraTags: (keys: string[]) => void;
}

function formatReleaseType(val: string): string {
  if (!val) return val;
  if (val.toLowerCase() === 'ep') return 'EP';
  return val.charAt(0).toUpperCase() + val.slice(1);
}

function ExtraTagsSection({ sourceTags, outputTags, onOutputChange, onClearAll }: { sourceTags: Record<string, string>; outputTags: Record<string, string>; onOutputChange: (key: string, value: string) => void; onClearAll: (keys: string[]) => void }) {
  const [expanded, setExpanded] = useState(false);
  const allKeys = [...new Set([...Object.keys(sourceTags), ...Object.keys(outputTags)])];

  const handleClearAll = () => {
    if (!window.confirm(`Delete ${allKeys.length} extra tag${allKeys.length > 1 ? 's' : ''} from file?`)) return;
    onClearAll(allKeys);
  };

  return (
    <div>
      <div>
        <button className="tag-extra-toggle" onClick={() => setExpanded(!expanded)}>
          <span className={`tag-extra-arrow${expanded ? ' open' : ''}`}>&#9654;</span>
          {allKeys.length > 0 ? `${allKeys.length} extra tag${allKeys.length > 1 ? 's' : ''}` : 'extra tags'}
        </button>
        <button className="tag-extra-clear" onClick={handleClearAll}>Clear all</button>
      </div>
      {expanded && (
        <div>
          <div className="tag-extra-header">
            <span>Tag</span>
            <span>Current</span>
            <span className="green">New</span>
          </div>
          {allKeys.map(key => (
            <div key={key} className="tag-extra-row">
              <div className="tag-cell">{key}</div>
              <div className="tag-cell">{sourceTags[key] || <span>—</span>}</div>
              <input
                type="text"
                value={outputTags[key] ?? ''}
                onChange={(e) => onOutputChange(key, e.target.value)}
                className="tag-input edited"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TagComparison({
  selectedResult,
  localTags,
  tagEnabled,
  editedSiteValues,
  editedExtraTags,
  stripRemoteParentheses,
  onTagEnabledChange,
  onEditedSiteValuesChange,
  onEditedExtraTagChange,
  onClearAllExtraTags,
}: TagComparisonProps) {
  const isDeezer = selectedResult ? selectedResult.source === 'deezer' : false;
  const deezerId = isDeezer && selectedResult ? Math.abs(selectedResult.postId) : null;

  const rawArtist = selectedResult
    ? (stripRemoteParentheses ? selectedResult.artist.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : selectedResult.artist)
    : (localTags?.artists?.[0] || localTags?.artist || '');
  const rawAlbumArtist = selectedResult
    ? (stripRemoteParentheses ? selectedResult.albumArtist.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : selectedResult.albumArtist)
    : (localTags?.albumArtist || localTags?.artist || '');

  const fields = useMemo(() => [
    { key: 'artist', label: 'Artist', file: localTags?.artists && localTags.artists.length > 0 ? localTags.artists : null, site: rawArtist },
    { key: 'albumArtist', label: 'Album Artist', file: localTags?.albumArtist || localTags?.artist, site: rawAlbumArtist },
    { key: 'album', label: 'Album', file: localTags?.album, site: selectedResult?.albumName ?? localTags?.album ?? '' },
    { key: 'year', label: 'Year', file: localTags?.year, site: selectedResult?.year ?? localTags?.year ?? '' },
    { key: 'genre', label: 'Genre', file: localTags?.genre, site: selectedResult?.genres?.join(', ') ?? localTags?.genre ?? '' },
    { key: 'country', label: 'Country', file: localTags?.country, site: selectedResult?.country ?? localTags?.country ?? '' },
    { key: 'label', label: 'Label', file: localTags?.label, site: selectedResult?.label ?? localTags?.label ?? '' },
    { key: 'releaseType', label: 'Type', file: localTags?.releaseType, site: selectedResult?.releaseType ?? localTags?.releaseType ?? '' },
  ], [selectedResult, localTags, rawArtist, rawAlbumArtist]);

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

  if (!selectedResult && !localTags) {
    return (
      <div>
        <div>&#9776;</div>
        <p>Select a folder with MP3 files</p>
        <p>Click a folder in the tree on the left</p>
      </div>
    );
  }

  const dgcPostId = localTags?.postId != null ? String(localTags.postId) : null;
  const dzDeezerId = localTags?.deezerId != null ? String(localTags.deezerId) : null;
  const siteDgcId = selectedResult && !isDeezer && selectedResult.postId > 0 ? String(selectedResult.postId) : null;
  const siteDeezerId = deezerId != null ? String(deezerId) : null;

  const renderLocalValue = (file: string[] | string | null | undefined, key: string) => {
    if (key === 'artist' && Array.isArray(file)) {
      if (file.length === 0) return <span>—</span>;
      if (file.length === 1) return (
        <div className="text-ellipsis">
          {file[0]}
        </div>
      );
      return (
        <div className="text-ellipsis">
          {file.join(' / ')}
        </div>
      );
    }
    if (!file) return <span>—</span>;
    return (
      <div className="text-ellipsis">
        {String(file)}
      </div>
    );
  };

  return (
    <div>
      <div className="tag-header">
        <span className="tag-header-label">FILE</span>
        <span className="tag-header-label center">TAGS</span>
        <span className="tag-header-label">CATALOG</span>
      </div>

      <div>
        {fields.map((f) => {
          const rawSiteVal = editedSiteValues[f.key] !== undefined ? editedSiteValues[f.key] : (f.site || '');
          const siteVal = f.key === 'releaseType' ? formatReleaseType(rawSiteVal) : rawSiteVal;
          const sim = fieldSims[f.key];
          const isDifferent = f.key === 'artist' && Array.isArray(f.file)
            ? false
            : String(f.file) !== rawSiteVal;
          const enabled = tagEnabled[f.key] !== false;
          const readonly = 'readonly' in f && (f as { readonly?: boolean }).readonly === true;
          const hasData = Boolean(f.file) && Boolean(f.site);
          const simClass = readonly ? '' : !hasData ? '' : sim === 100 ? 'green' : sim >= 80 ? 'yellow' : 'red';

          return (
            <div key={f.key} className="hover-bg">
              <div className="data-row tag-grid tag-row">
                <div className="track-chk">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={readonly}
                    onChange={(e) => onTagEnabledChange(f.key, e.target.checked)}
                    title={readonly ? `${f.label} — read only` : (enabled ? `Writing ${f.label} tag — click to skip` : `Skipping ${f.label} tag — click to include`)}
                  />
                </div>
                <div className="tag-cell">
                  <span className="text-ellipsis tag-cell-input">
                    {renderLocalValue(f.file, f.key)}
                  </span>
                  <span className="tag-cell-label">{f.label}</span>
                </div>
                <div className={`tag-percent${simClass ? ' ' + simClass : ''}`}>
                  {readonly ? '' : hasData ? `${sim}%` : '—'}
                </div>
                <input
                  type="text"
                  value={siteVal}
                  readOnly={readonly}
                  onChange={(e) => onEditedSiteValuesChange(f.key, e.target.value)}
                  className={`tag-input${readonly ? ' readonly' : isDifferent ? ' edited' : ''}`}
                />
              </div>
            </div>
          );
        })}

        {/* IDs row */}
        <div className="hover-bg">
          <div className="data-row tag-grid tag-ids-row">
            <div className="track-chk">
              <input type="checkbox" checked disabled readOnly />
            </div>
            <div className="tag-id-cell">
              <span>
                <span className="tag-id-label">DGC</span>
                <span className="text-ellipsis tag-id-value">{dgcPostId || <span>—</span>}</span>
              </span>
              <span className="tag-id-divider" />
              <span>
                <span className="tag-id-label">DZ</span>
                <span className="text-ellipsis tag-id-value">{dzDeezerId || <span>—</span>}</span>
              </span>
            </div>
            <div className="tag-percent" />
            <div className="tag-id-cell">
              <span>
                <span className="tag-id-label">DGC</span>
                <span className="text-ellipsis tag-id-value">{siteDgcId || <span>—</span>}</span>
              </span>
              <span className="tag-id-divider" />
              <span>
                <span className="tag-id-label">DZ</span>
                <span className="text-ellipsis tag-id-value">{siteDeezerId || <span>—</span>}</span>
              </span>
            </div>
          </div>
        </div>

        <ExtraTagsSection
          sourceTags={localTags?.extraTags || {}}
          outputTags={(() => {
            const tags: Record<string, string> = {};
            const skip = new Set(['country', 'label', 'releasetype', 'genre', 'DGC_POST_ID', 'DEEZER_ID']);
            if (localTags?.extraTags) {
              for (const [k, v] of Object.entries(localTags.extraTags)) {
                if (!skip.has(k)) tags[k] = v;
              }
            }
            if (selectedResult?.extraTags) {
              for (const [k, v] of Object.entries(selectedResult.extraTags)) {
                if (!skip.has(k) && !tags[k]) tags[k] = v;
              }
            }
            for (const [k, v] of Object.entries(editedExtraTags)) {
              if (!skip.has(k)) tags[k] = v;
            }
            return tags;
          })()}
          onOutputChange={onEditedExtraTagChange}
          onClearAll={onClearAllExtraTags}
        />
      </div>
    </div>
  );
}
