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
];

const SOURCE_FIELDS = [
  { id: 'dgc', label: 'DGC', colorClass: 'text-dgc' },
  { id: 'deezer', label: 'Deezer', colorClass: 'text-deezer' },
  { id: 'mbrainz', label: 'MusicBrainz', colorClass: 'text-mbrainz' },
  { id: 'bandcamp', label: 'Bandcamp', colorClass: 'text-bandcamp' },
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Settings size={12} className="text-red" />
            <span className="modal-header-title">SETTINGS</span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={14} />
          </button>
        </div>
        <div className="modal-content">
          <div className="settings-section">
            <div className="settings-section-title">Default Tag Mappings</div>
            {TAG_FIELDS.map(f => (
              <label key={f.key} className="settings-field">
                <input type="checkbox" checked={tagDefaults[f.key]} onChange={() => toggleTag(f.key)} />
                {f.label}
              </label>
            ))}
            <div className="settings-note">These defaults are remembered between albums</div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Search Sources</div>
            {SOURCE_FIELDS.map(s => (
              <label key={s.id} className="settings-field">
                <input type="checkbox" checked={enabledSources[s.id] !== false} onChange={() => toggleSource(s.id)} />
                <span className={s.colorClass}>{s.label}</span>
              </label>
            ))}
            <div className="settings-note">Disabled sources won't be searched</div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">Cleanup Ignore Patterns</div>
            {cleanupIgnorePatterns.length > 0 && (
              <div className="settings-tag-list">
                {cleanupIgnorePatterns.map((p, i) => (
                  <span key={i} className="settings-tag">
                    {p}
                    <button onClick={() => onCleanupIgnorePatternsChange(cleanupIgnorePatterns.filter((_, j) => j !== i))}>&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="settings-add-row">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }}
                placeholder="e.g. .DS_Store"
                className="modal-input"
              />
              <button className="modal-btn secondary" onClick={() => { if (newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }}>Add</button>
            </div>
            <div className="settings-note">Files ignored when checking if artist folder is empty after move</div>
          </div>

          <button onClick={onSave} disabled={saving} className="modal-btn primary">
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div className="settings-section">
            <div className="settings-section-title">Cache</div>
            <button onClick={onClearCache} disabled={clearingCache} className="modal-btn secondary">
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div className="settings-note">Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
