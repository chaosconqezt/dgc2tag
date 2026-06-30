import { useEffect, useState } from 'react';
import { Settings, X, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  saving: boolean;
  onSave: () => void;
  onClearCache: () => void;
  clearingCache: boolean;
  tagDefaults: Record<string, boolean>;
  onTagDefaultsChange: (defaults: Record<string, boolean>) => void;
  enabledSources: Record<string, boolean>;
  onEnabledSourcesChange: (sources: Record<string, boolean>) => void;
  cleanupIgnorePatterns: string[];
  onCleanupIgnorePatternsChange: (patterns: string[]) => void;
  onClose: () => void;
}

const TAG_FIELDS = [
  { key: 'artist', label: 'Artist' },
  { key: 'albumArtist', label: 'Album Artist' },
  { key: 'album', label: 'Album' },
  { key: 'year', label: 'Year' },
  { key: 'genre', label: 'Genre' },
  { key: 'country', label: 'Country' },
  { key: 'label', label: 'Label' },
  { key: 'releaseType', label: 'Release Type' },
  { key: 'postId', label: 'Post ID' },
];

const SOURCE_FIELDS = [
  { id: 'dgc', label: 'DGC', color: 'var(--red)' },
  { id: 'deezer', label: 'Deezer', color: 'var(--green)' },
  { id: 'mbrainz', label: 'MusicBrainz', color: 'var(--orange)' },
  { id: 'discogs', label: 'Discogs', color: '#333333' },
];

export function SettingsModal({ saving, onSave, onClearCache, clearingCache, tagDefaults, onTagDefaultsChange, enabledSources, onEnabledSourcesChange, cleanupIgnorePatterns, onCleanupIgnorePatternsChange, onClose }: SettingsModalProps) {
  const [newPattern, setNewPattern] = useState('');
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleTag = (key: string) => {
    onTagDefaultsChange({ ...tagDefaults, [key]: !tagDefaults[key] });
  };

  const toggleSource = (id: string) => {
    onEnabledSourcesChange({ ...enabledSources, [id]: !enabledSources[id] });
  };

  const srcEnabled = (id: string) => enabledSources[id] !== false;

  return (
    <div className="progress-overlay" onClick={onClose}>
      <div className="progress-panel settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="progress-header" data-alt="true">
          <div className="row gap-md">
            <Settings size={12} color="var(--red)" />
            <span className="settings-header-title">SETTINGS</span>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={14} />
          </button>
        </div>
        <div className="settings-body">
          <div>
            <label className="settings-label">Default Tag Mappings</label>
            <div className="settings-tag-grid">
              {TAG_FIELDS.map(f => (
                <label key={f.key} className="settings-tag-item" data-on={String(!!tagDefaults[f.key])}>
                  <input type="checkbox" className="cb-sm" checked={tagDefaults[f.key]} onChange={() => toggleTag(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="hint">These defaults are remembered between albums</div>
          </div>

          <div>
            <label className="settings-label">Search Sources</label>
            <div className="settings-source-wrap">
              {SOURCE_FIELDS.map(s => (
                <label key={s.id} className="settings-source-item" data-on={String(srcEnabled(s.id))} style={{ '--src-color': s.color } as React.CSSProperties}>
                  <input type="checkbox" className="cb-sm" checked={srcEnabled(s.id)} onChange={() => toggleSource(s.id)} style={{ accentColor: s.color }} />
                  {s.label}
                </label>
              ))}
            </div>
            <div className="hint">Disabled sources won't be searched</div>
          </div>

          <div>
            <label className="settings-label">Cleanup Ignore Patterns</label>
            <div className="settings-pattern-wrap">
              {cleanupIgnorePatterns.map((p, i) => (
                <span key={i} className="settings-pattern-tag">
                  {p}
                  <button className="btn-icon settings-pattern-del" onClick={() => onCleanupIgnorePatternsChange(cleanupIgnorePatterns.filter((_, j) => j !== i))}>&times;</button>
                </span>
              ))}
            </div>
            <div className="settings-input-row">
              <input type="text" className="settings-pattern-input" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }} placeholder="e.g. .DS_Store" />
              <button className="btn-add" onClick={() => { if (newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }}>Add</button>
            </div>
            <div className="hint">Files ignored when checking if artist folder is empty after move</div>
          </div>

          <button className="settings-btn-full settings-btn-save" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div className="settings-section">
            <label className="settings-label">Cache</label>
            <button className="settings-btn-full settings-btn-cache" onClick={onClearCache} disabled={clearingCache}>
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div className="hint">Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
