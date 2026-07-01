import { useEffect, useState } from 'react';
import { Settings, X, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  saving: boolean;
  onSave: () => void;
  onClearCache: () => void;
  clearingCache: boolean;
  tagDefaults: Record<string, boolean>;
  onTagDefaultsChange: (defaults: Record<string, boolean>) => void;
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

const section: React.CSSProperties = { borderTop: '1px solid var(--border)', paddingTop: 12 };

export function SettingsModal({
  saving, onSave, onClearCache, clearingCache,
  tagDefaults, onTagDefaultsChange,
  cleanupIgnorePatterns, onCleanupIgnorePatternsChange, onClose,
}: SettingsModalProps) {
  const [newPattern, setNewPattern] = useState('');
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleTag = (key: string) => {
    onTagDefaultsChange({ ...tagDefaults, [key]: !tagDefaults[key] });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ width: 420, height: 'auto', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--panel-bg)' }}>
          <div className="row gap-md">
            <Settings size={12} color="var(--accent)" />
            <span style={{ fontWeight: 500, color: 'var(--text-dim)' }}>SETTINGS</span>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={14} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)' }}>
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--fs)', color: 'var(--text-dim)',
              fontWeight: 'var(--fw-bold)', textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: 'var(--gap-md)',
            }}>Default Tag Mappings</label>
            <div className="st-grid">
              {TAG_FIELDS.map(f => (
                <label key={f.key} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--gap-md)',
                  cursor: 'pointer', fontSize: 'var(--fs)', color: 'var(--text-dim)',
                  padding: 'var(--gap-xs) var(--gap-md)', borderRadius: 'var(--radius-sm)',
                  background: tagDefaults[f.key] ? 'var(--border-light)' : 'none',
                }}>
                  <input type="checkbox" className="cb" checked={tagDefaults[f.key]} onChange={() => toggleTag(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-faint)' }}>These defaults are remembered between albums</div>
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 'var(--fs)', color: 'var(--text-dim)',
              fontWeight: 'var(--fw-bold)', textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: 'var(--gap-md)',
            }}>Cleanup Ignore Patterns</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-md)' }}>
              {cleanupIgnorePatterns.map((p, i) => (
                <span key={i} className="st-tag">
                  {p}
                  <button className="btn-icon" style={{ padding: 0, fontSize: 'var(--fs)' }} onClick={() => onCleanupIgnorePatternsChange(cleanupIgnorePatterns.filter((_, j) => j !== i))}>&times;</button>
                </span>
              ))}
            </div>
            <div className="row gap-sm">
              <input type="text" className="input" style={{ height: 32, boxSizing: 'border-box' }}
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }}
                placeholder="e.g. .DS_Store" />
              <button className="btn btn-ghost" onClick={() => { if (newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }}>Add</button>
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-faint)' }}>Files ignored when checking if artist folder is empty after move</div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: 32, justifyContent: 'center' }} onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div style={section}>
            <label style={{
              display: 'block', fontSize: 'var(--fs)', color: 'var(--text-dim)',
              fontWeight: 'var(--fw-bold)', textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: 'var(--gap-md)',
            }}>Cache</label>
            <button className="btn btn-ghost" style={{ width: '100%', height: 32, justifyContent: 'center' }} onClick={onClearCache} disabled={clearingCache}>
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-faint)' }}>Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
