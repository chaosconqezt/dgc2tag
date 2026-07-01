import { useMemo, useState } from 'react';
import type { AlbumTags, SearchResult } from '../types';
import { similarity } from '../utils';
import { SimPercent } from './SimPercent';

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
    <div style={{ marginTop: 'var(--gap-sm)' }}>
      <div className="row" style={{ gap: 'var(--gap-sm)' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--gap-sm) 0', display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', color: 'var(--text-faint)', fontSize: 12 }}
        >
          <span style={{ transition: 'transform 0.1s', transform: expanded ? 'rotate(90deg)' : 'none', fontSize: 10 }}>&#9654;</span>
          {allKeys.length > 0 ? `${allKeys.length} extra tag${allKeys.length > 1 ? 's' : ''}` : 'extra tags'}
        </button>
        <button
          onClick={handleClearAll}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-faint)', fontSize: 11 }}
        >
          Clear all
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 'var(--gap-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-sm)', fontSize: 11, color: 'var(--text-faint)', padding: '0 var(--gap-sm)' }}>
            <div>Tag</div>
            <div>Current</div>
            <div style={{ color: 'var(--accent)' }}>New</div>
          </div>
          {allKeys.map(key => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-sm)', marginTop: 'var(--gap-xs)' }}>
              <div className="cell-fixed">{key}</div>
              <div className="cell-fixed">
                {sourceTags[key] || <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>}
              </div>
              <div className="cell-fixed">
                <input
                  type="text"
                  value={outputTags[key] ?? ''}
                  onChange={(e) => onOutputChange(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TagComparison({
  selectedResult, localTags, tagEnabled, editedSiteValues, editedExtraTags, stripRemoteParentheses,
  onTagEnabledChange, onEditedSiteValuesChange, onEditedExtraTagChange, onClearAllExtraTags,
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
      if (!f.file || !f.site) { sims[f.key] = 0; continue; }
      let compareVal: string;
      if (f.key === 'artist' && Array.isArray(f.file)) {
        compareVal = f.file.join(' / ');
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
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-faint)' }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>&#9776;</div>
        <p style={{ margin: 0 }}>Select a folder with MP3 files</p>
        <p style={{ margin: 'var(--gap-sm) 0 0', fontSize: 12 }}>Click a folder in the tree on the left</p>
      </div>
    );
  }

  const dgcPostId = localTags?.postId != null ? String(localTags.postId) : null;
  const dzDeezerId = localTags?.deezerId != null ? String(localTags.deezerId) : null;
  const siteDgcId = selectedResult && !isDeezer && selectedResult.postId > 0 ? String(selectedResult.postId) : null;
  const siteDeezerId = deezerId != null ? String(deezerId) : null;

  const renderLocalValue = (file: string[] | string | null | undefined) => {
    if (Array.isArray(file)) {
      if (file.length === 0) return <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>;
      return <span className="text-ellipsis">{file.join(' / ')}</span>;
    }
    if (!file) return <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>;
    return <span className="text-ellipsis">{String(file)}</span>;
  };

  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)' }}>FILE</span>
        <span style={{ flex: 0, padding: '0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)' }}>TAGS</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)' }}>CATALOG</span>
      </div>

      <div>
        {fields.map((f) => {
          const rawSiteVal = editedSiteValues[f.key] !== undefined ? editedSiteValues[f.key] : (f.site || '');
          const siteVal = f.key === 'releaseType' ? formatReleaseType(rawSiteVal) : rawSiteVal;
          const sim = fieldSims[f.key];
          const enabled = tagEnabled[f.key] !== false;

          return (
            <div key={f.key} className="tc-grid" style={{ marginBottom: 'var(--gap-sm)', opacity: enabled ? 1 : 0.85 }}>
              <input
                type="checkbox"
                className="cb"
                style={{ justifySelf: 'center' }}
                checked={enabled}
                onChange={(e) => onTagEnabledChange(f.key, e.target.checked)}
                title={enabled ? `Writing ${f.label} tag — click to skip` : `Skipping ${f.label} tag — click to include`}
              />
              <div className="cell-fixed">
                <span className="text-ellipsis" style={{ flex: 1, minWidth: 0 }}>{renderLocalValue(f.file)}</span>
                <span style={{ opacity: 0.5, marginLeft: 'var(--gap-sm)', flexShrink: 0 }}>{f.label}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {<SimPercent value={sim} />}
              </div>
              <div className="cell-fixed">
                <input
                  type="text"
                  value={siteVal}
                  onChange={(e) => onEditedSiteValuesChange(f.key, e.target.value)}
                />
              </div>
            </div>
          );
        })}

        <div className="tc-grid" style={{ marginBottom: 'var(--gap-sm)' }}>
          <div />
          <div className="cell-fixed" style={{ gap: 'var(--gap-sm)' }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
              <span style={{ opacity: 0.66, flexShrink: 0 }}>DGC</span>
              <span className="text-ellipsis">{dgcPostId || <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>}</span>
            </span>
            <span style={{ width: 1, background: 'var(--border-light)', alignSelf: 'stretch' }} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
              <span style={{ opacity: 0.66, flexShrink: 0 }}>DZ</span>
              <span className="text-ellipsis">{dzDeezerId || <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>}</span>
            </span>
          </div>
          <div />
          <div className="cell-fixed" style={{ gap: 'var(--gap-sm)' }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
              <span style={{ opacity: 0.66, flexShrink: 0 }}>DGC</span>
              <span className="text-ellipsis">{siteDgcId || <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>}</span>
            </span>
            <span style={{ width: 1, background: 'var(--border-light)', alignSelf: 'stretch' }} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
              <span style={{ opacity: 0.66, flexShrink: 0 }}>DZ</span>
              <span className="text-ellipsis">{siteDeezerId || <span style={{ color: 'var(--text-faint)' }}>&mdash;</span>}</span>
            </span>
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
