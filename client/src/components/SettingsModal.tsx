import { useEffect } from 'react';
import { Settings, X, Trash2 } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

interface SettingsModalProps {
  musicRoot: string;
  outputFolder: string;
  outputMode: 'subfolder' | 'absolute';
  saving: boolean;
  onMusicRootChange: (value: string) => void;
  onOutputFolderChange: (value: string) => void;
  onOutputModeChange: (mode: 'subfolder' | 'absolute') => void;
  onSave: () => void;
  onClearCache: () => void;
  clearingCache: boolean;
  tagDefaults: Record<string, boolean>;
  onTagDefaultsChange: (defaults: Record<string, boolean>) => void;
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

export function SettingsModal({ musicRoot, outputFolder, outputMode, saving, onMusicRootChange, onOutputFolderChange, onOutputModeChange, onSave, onClearCache, clearingCache, tagDefaults, onTagDefaultsChange, onClose }: SettingsModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleTag = (key: string) => {
    onTagDefaultsChange({ ...tagDefaults, [key]: !tagDefaults[key] });
  };

  const labelStyle = { display: 'block' as const, fontSize: FS, color: COLORS.textDim, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT };
  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: COLORS.bg, border: `1px solid ${COLORS.textInvisible}`, borderRadius: '6px', padding: '8px 10px', color: COLORS.text, fontSize: FS, fontFamily: FONT };
  const hintStyle = { fontSize: FS, color: COLORS.textInvisible, marginTop: '4px', fontFamily: FONT };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '420px', backgroundColor: COLORS.inputBg, borderRadius: '10px', border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.inputBgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} color={COLORS.red} />
            <span style={{ fontSize: FS, color: COLORS.textMuted, fontWeight: '500', fontFamily: FONT }}>SETTINGS</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textDim, cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Music Library Path</label>
            <input type="text" value={musicRoot} onChange={(e) => onMusicRootChange(e.target.value)} style={inputStyle} placeholder="c:\music\library" />
            <div style={hintStyle}>Output will be placed in this subfolder inside the library</div>
          </div>

          <div>
            <label style={labelStyle}>Output Path</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: FS, color: outputMode === 'subfolder' ? COLORS.text : COLORS.textFaint, fontFamily: FONT, padding: '4px 8px', borderRadius: '4px', backgroundColor: outputMode === 'subfolder' ? COLORS.borderLight : 'transparent', border: `1px solid ${outputMode === 'subfolder' ? COLORS.textInvisible : 'transparent'}` }}>
                <input type="radio" name="outputMode" checked={outputMode === 'subfolder'} onChange={() => onOutputModeChange('subfolder')} style={{ accentColor: COLORS.red }} />
                Subfolder
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: FS, color: outputMode === 'absolute' ? COLORS.text : COLORS.textFaint, fontFamily: FONT, padding: '4px 8px', borderRadius: '4px', backgroundColor: outputMode === 'absolute' ? COLORS.borderLight : 'transparent', border: `1px solid ${outputMode === 'absolute' ? COLORS.textInvisible : 'transparent'}` }}>
                <input type="radio" name="outputMode" checked={outputMode === 'absolute'} onChange={() => onOutputModeChange('absolute')} style={{ accentColor: COLORS.red }} />
                Absolute Path
              </label>
            </div>
            {outputMode === 'subfolder' ? (
              <>
                <input type="text" value={outputFolder} onChange={(e) => onOutputFolderChange(e.target.value)} style={inputStyle} placeholder="dgc" />
                <div style={hintStyle}>Subfolder inside the music library</div>
              </>
            ) : (
              <>
                <input type="text" value={outputFolder} onChange={(e) => onOutputFolderChange(e.target.value)} style={inputStyle} placeholder="d:\output\releases" />
                <div style={hintStyle}>Full path to output directory</div>
              </>
            )}
          </div>

          <div>
            <label style={labelStyle}>Default Tag Mappings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TAG_FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: FS, color: COLORS.textMuted, fontFamily: FONT, padding: '3px 6px', borderRadius: '4px', backgroundColor: tagDefaults[f.key] ? COLORS.borderLight : 'transparent' }}>
                  <input type="checkbox" checked={tagDefaults[f.key]} onChange={() => toggleTag(f.key)} style={{ accentColor: COLORS.red, width: '12px', height: '12px', cursor: 'pointer' }} />
                  {f.label}
                </label>
              ))}
            </div>
            <div style={hintStyle}>These defaults are remembered between albums</div>
          </div>

          <button onClick={onSave} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: COLORS.red, color: '#fff', border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontFamily: FONT }}>
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '12px' }}>
            <label style={labelStyle}>Cache</label>
            <button onClick={onClearCache} disabled={clearingCache} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: COLORS.border, color: COLORS.textMuted, border: `1px solid ${COLORS.textInvisible}`, borderRadius: '6px', cursor: clearingCache ? 'wait' : 'pointer', fontFamily: FONT }}>
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div style={hintStyle}>Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
