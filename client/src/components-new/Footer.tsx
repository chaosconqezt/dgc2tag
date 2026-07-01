import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { FolderPicker } from './FolderPicker';
import { BUILD, CHANGES } from '../build';

interface FooterProps {
  musicRoot: string;
  outputFolder: string;
  outputMode: 'subfolder' | 'absolute';
  onMusicRootChange: (path: string) => void;
  onOutputFolderChange: (path: string) => void;
  onOutputModeChange: (mode: 'subfolder' | 'absolute') => void;
  onSave: () => void;
}

export function Footer({ musicRoot, outputFolder, outputMode, onMusicRootChange, onOutputFolderChange, onOutputModeChange, onSave }: FooterProps) {
  const [pickerTarget, setPickerTarget] = useState<'musicRoot' | 'output' | null>(null);

  const displayOutput = outputMode === 'subfolder'
    ? `${musicRoot}\\${outputFolder}`
    : outputFolder;

  const handleSelect = (path: string) => {
    if (pickerTarget === 'musicRoot') {
      onMusicRootChange(path);
    } else if (pickerTarget === 'output') {
      onOutputFolderChange(path);
    }
    setPickerTarget(null);
    onSave();
  };

  const modeBtnStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    background: isActive ? 'var(--border-light)' : 'none',
    border: `1px solid ${isActive ? 'var(--text-disabled)' : 'transparent'}`,
    color: isActive ? 'var(--text)' : 'var(--text-faint)',
  });

  return (
    <div className="footer row" style={{ gap: 16 }}>
      <div className="row gap-sm" style={{ minWidth: 0 }}>
        <span className="text-faint">SRC:</span>
        <span className="text-ellipsis text-mono" style={{ maxWidth: 200, color: 'var(--text-dim)' }} title={musicRoot}>
          {musicRoot || '(not set)'}
        </span>
        <button
          onClick={() => setPickerTarget('musicRoot')}
          title="Change music library path"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)' }}
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="text-faint">|</span>

      <div className="row gap-sm" style={{ minWidth: 0 }}>
        <span className="text-faint">OUT:</span>
        <span className="text-ellipsis text-mono" style={{ maxWidth: 200, color: 'var(--text-dim)' }} title={displayOutput}>
          {displayOutput || '(not set)'}
        </span>
        <button
          onClick={() => setPickerTarget('output')}
          title="Change output folder"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)' }}
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="text-faint">|</span>

      <div className="row gap-xs">
        <button
          style={modeBtnStyle(outputMode === 'subfolder')}
          onClick={() => { onOutputModeChange('subfolder'); onSave(); }}
        >
          subfolder
        </button>
        <button
          style={modeBtnStyle(outputMode === 'absolute')}
          onClick={() => { onOutputModeChange('absolute'); onSave(); }}
        >
          absolute
        </button>
      </div>

      <span className="text-faint">|</span>
      <span className="text-faint" title={CHANGES[BUILD] || ''}>
        b{BUILD}
      </span>

      <div className="flex-1" />

      {pickerTarget && (
        <FolderPicker
          initialPath={pickerTarget === 'musicRoot' ? musicRoot : (outputMode === 'subfolder' ? musicRoot : outputFolder)}
          onSelect={handleSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
