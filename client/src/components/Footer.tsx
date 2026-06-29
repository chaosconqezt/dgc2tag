import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { FolderPicker } from './FolderPicker';

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

  return (
    <div className="footer-bar">
      {/* Music root */}
      <div className="footer-path">
        <span className="footer-path-label">SRC:</span>
        <span className="text-ellipsis footer-path-value" title={musicRoot}>
          {musicRoot || '(not set)'}
        </span>
        <button
          className="footer-btn"
          onClick={() => setPickerTarget('musicRoot')}
          title="Change music library path"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="footer-sep">|</span>

      {/* Output */}
      <div className="footer-path">
        <span className="footer-path-label">OUT:</span>
        <span className="text-ellipsis footer-path-value" title={displayOutput}>
          {displayOutput || '(not set)'}
        </span>
        <button
          className="footer-btn"
          onClick={() => setPickerTarget('output')}
          title="Change output folder"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="footer-sep">|</span>

      {/* Output mode toggle */}
      <div className="footer-mode-group">
        <button
          className="footer-mode-btn"
          data-active={String(outputMode === 'subfolder')}
          onClick={() => { onOutputModeChange('subfolder'); onSave(); }}
        >
          subfolder
        </button>
        <button
          className="footer-mode-btn"
          data-active={String(outputMode === 'absolute')}
          onClick={() => { onOutputModeChange('absolute'); onSave(); }}
        >
          absolute
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Folder picker modal */}
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
