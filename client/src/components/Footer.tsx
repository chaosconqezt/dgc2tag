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
    <div className="footer">
      {/* Music root */}
      <div className="footer-section">
        <span className="footer-section-label">SRC:</span>
        <span className="text-ellipsis footer-path text-muted" title={musicRoot}>
          {musicRoot || '(not set)'}
        </span>
        <button onClick={() => setPickerTarget('musicRoot')} className="footer-icon-btn" title="Change music library path">
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="footer-sep">|</span>

      {/* Output */}
      <div className="footer-section">
        <span className="footer-section-label">OUT:</span>
        <span className="text-ellipsis footer-path text-muted" title={displayOutput}>
          {displayOutput || '(not set)'}
        </span>
        <button onClick={() => setPickerTarget('output')} className="footer-icon-btn" title="Change output folder">
          <FolderOpen size={12} />
        </button>
      </div>

      <span className="footer-sep">|</span>

      {/* Output mode toggle */}
      <div className="footer-mode-group">
        <button
          onClick={() => { onOutputModeChange('subfolder'); onSave(); }}
          className={`footer-mode-btn${outputMode === 'subfolder' ? ' active' : ''}`}
        >
          subfolder
        </button>
        <button
          onClick={() => { onOutputModeChange('absolute'); onSave(); }}
          className={`footer-mode-btn${outputMode === 'absolute' ? ' active' : ''}`}
        >
          absolute
        </button>
      </div>

      <div className="footer-spacer" />

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
