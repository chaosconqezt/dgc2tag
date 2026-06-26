import { useEffect, useState } from 'react';
import { Settings, X, Trash2 } from 'lucide-react';
import { FONT, FS, COLORS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL, MODAL_HEADER, LABEL_STYLE, MODAL_INPUT_STYLE, HINT_STYLE } from './styles';

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
  { id: 'dgc', label: 'DGC', color: COLORS.red },
  { id: 'deezer', label: 'Deezer', color: COLORS.green },
  { id: 'mbrainz', label: 'MusicBrainz', color: COLORS.mbrainz },
  { id: 'bandcamp', label: 'Bandcamp', color: COLORS.bandcamp },
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
    <div style={OVERLAY_BACKDROP} onClick={onClose}>
      <div style={{ ...MODAL_PANEL, width: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={MODAL_HEADER}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} color={COLORS.red} />
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>SETTINGS</span>
          </div>
          <button onClick={onClose} style={{ ...ICON_BUTTON, padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={LABEL_STYLE}>Default Tag Mappings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TAG_FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: FS, color: COLORS.textMuted, fontFamily: FONT, padding: '3px 6px', borderRadius: '4px', backgroundColor: tagDefaults[f.key] ? COLORS.borderLight : 'transparent' }}>
                  <input type="checkbox" checked={tagDefaults[f.key]} onChange={() => toggleTag(f.key)} style={{ accentColor: COLORS.red, width: '12px', height: '12px', cursor: 'pointer' }} />
                  {f.label}
                </label>
              ))}
            </div>
            <div style={HINT_STYLE}>These defaults are remembered between albums</div>
          </div>

          <div>
            <label style={LABEL_STYLE}>Search Sources</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {SOURCE_FIELDS.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: FS, color: enabledSources[s.id] !== false ? s.color : COLORS.textFaint, fontFamily: FONT, padding: '4px 8px', borderRadius: '4px', backgroundColor: enabledSources[s.id] !== false ? `${s.color}15` : 'transparent', border: `1px solid ${enabledSources[s.id] !== false ? `${s.color}40` : COLORS.textInvisible}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={enabledSources[s.id] !== false} onChange={() => toggleSource(s.id)} style={{ accentColor: s.color, width: '12px', height: '12px', cursor: 'pointer' }} />
                  {s.label}
                </label>
              ))}
            </div>
            <div style={HINT_STYLE}>Disabled sources won't be searched</div>
          </div>

          <div>
            <label style={LABEL_STYLE}>Cleanup Ignore Patterns</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              {cleanupIgnorePatterns.map((p, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: FS, color: COLORS.textMuted, fontFamily: FONT, padding: '3px 8px', borderRadius: '4px', backgroundColor: COLORS.borderLight, border: `1px solid ${COLORS.textInvisible}` }}>
                  {p}
                  <button onClick={() => onCleanupIgnorePatternsChange(cleanupIgnorePatterns.filter((_, j) => j !== i))} style={{ ...ICON_BUTTON, padding: 0, fontSize: FS, lineHeight: 1 }}>&times;</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }} style={{ ...MODAL_INPUT_STYLE, flex: 1 }} placeholder="e.g. .DS_Store" />
              <button onClick={() => { if (newPattern.trim()) { onCleanupIgnorePatternsChange([...cleanupIgnorePatterns, newPattern.trim()]); setNewPattern(''); } }} style={{ background: COLORS.border, color: COLORS.textMuted, border: `1px solid ${COLORS.textInvisible}`, borderRadius: '6px', padding: '4px 10px', fontSize: FS, cursor: 'pointer', fontFamily: FONT }}>Add</button>
            </div>
            <div style={HINT_STYLE}>Files ignored when checking if artist folder is empty after move</div>
          </div>

          <button onClick={onSave} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: COLORS.red, color: COLORS.textBright, border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontFamily: FONT }}>
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '12px' }}>
            <label style={LABEL_STYLE}>Cache</label>
            <button onClick={onClearCache} disabled={clearingCache} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: COLORS.border, color: COLORS.textMuted, border: `1px solid ${COLORS.textInvisible}`, borderRadius: '6px', cursor: clearingCache ? 'wait' : 'pointer', fontFamily: FONT }}>
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div style={HINT_STYLE}>Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
