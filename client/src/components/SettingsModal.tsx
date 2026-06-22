import { Settings, X, Trash2 } from 'lucide-react';
import { FONT, FS } from './styles';

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
  const toggleTag = (key: string) => {
    onTagDefaultsChange({ ...tagDefaults, [key]: !tagDefaults[key] });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '420px', backgroundColor: '#18181b', borderRadius: '10px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #27272a', backgroundColor: '#0c0c0e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} color="#ef4444" />
            <span style={{ fontSize: FS, color: '#a1a1aa', fontWeight: '500', fontFamily: FONT }}>SETTINGS</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: FS, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>Music Library Path</label>
            <input
              type="text"
              value={musicRoot}
              onChange={(e) => onMusicRootChange(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 10px', color: '#f4f4f5', fontSize: FS, outline: 'none', fontFamily: FONT }}
              placeholder="c:\music\library"
            />
            <div style={{ fontSize: FS, color: '#3f3f46', marginTop: '4px', fontFamily: FONT }}>Output will be placed in this subfolder inside the library</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: FS, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>Output Path</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: FS, color: outputMode === 'subfolder' ? '#f4f4f5' : '#52525b', fontFamily: FONT, padding: '4px 8px', borderRadius: '4px', backgroundColor: outputMode === 'subfolder' ? '#1f1f23' : 'transparent', border: `1px solid ${outputMode === 'subfolder' ? '#3f3f46' : 'transparent'}` }}>
                <input type="radio" name="outputMode" checked={outputMode === 'subfolder'} onChange={() => onOutputModeChange('subfolder')} style={{ accentColor: '#ef4444' }} />
                Subfolder
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: FS, color: outputMode === 'absolute' ? '#f4f4f5' : '#52525b', fontFamily: FONT, padding: '4px 8px', borderRadius: '4px', backgroundColor: outputMode === 'absolute' ? '#1f1f23' : 'transparent', border: `1px solid ${outputMode === 'absolute' ? '#3f3f46' : 'transparent'}` }}>
                <input type="radio" name="outputMode" checked={outputMode === 'absolute'} onChange={() => onOutputModeChange('absolute')} style={{ accentColor: '#ef4444' }} />
                Absolute Path
              </label>
            </div>
            {outputMode === 'subfolder' ? (
              <>
                <input
                  type="text"
                  value={outputFolder}
                  onChange={(e) => onOutputFolderChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 10px', color: '#f4f4f5', fontSize: FS, outline: 'none', fontFamily: FONT }}
                  placeholder="dgc"
                />
                <div style={{ fontSize: FS, color: '#3f3f46', marginTop: '4px', fontFamily: FONT }}>Subfolder inside the music library</div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={outputFolder}
                  onChange={(e) => onOutputFolderChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 10px', color: '#f4f4f5', fontSize: FS, outline: 'none', fontFamily: FONT }}
                  placeholder="d:\output\releases"
                />
                <div style={{ fontSize: FS, color: '#3f3f46', marginTop: '4px', fontFamily: FONT }}>Full path to output directory</div>
              </>
            )}
          </div>

          {/* Tag defaults */}
          <div>
            <label style={{ display: 'block', fontSize: FS, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>Default Tag Mappings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TAG_FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: FS, color: '#a1a1aa', fontFamily: FONT, padding: '3px 6px', borderRadius: '4px', backgroundColor: tagDefaults[f.key] ? '#1f1f23' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={tagDefaults[f.key]}
                    onChange={() => toggleTag(f.key)}
                    style={{ accentColor: '#ef4444', width: '12px', height: '12px', cursor: 'pointer' }}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <div style={{ fontSize: FS, color: '#3f3f46', marginTop: '4px', fontFamily: FONT }}>These defaults are remembered between albums</div>
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontFamily: FONT }}
          >
            {saving ? 'Saving...' : 'Save & Reload'}
          </button>

          <div style={{ borderTop: '1px solid #27272a', paddingTop: '12px' }}>
            <label style={{ display: 'block', fontSize: FS, color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: FONT }}>Cache</label>
            <button
              onClick={onClearCache}
              disabled={clearingCache}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', fontSize: FS, background: '#27272a', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '6px', cursor: clearingCache ? 'wait' : 'pointer', fontFamily: FONT }}
            >
              <Trash2 size={12} />
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <div style={{ fontSize: FS, color: '#3f3f46', marginTop: '4px', fontFamily: FONT }}>Clear cached album data from deathgrind.club</div>
          </div>
        </div>
      </div>
    </div>
  );
}
