import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { FONT, COLORS } from './styles';
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
    <div style={{
      borderTop: `1px solid ${COLORS.border}`,
      padding: '4px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backgroundColor: COLORS.inputBgAlt,
      fontFamily: FONT,
      fontSize: '11px',
      color: COLORS.textDim,
      flexShrink: 0,
    }}>
      {/* Music root */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
        <span style={{ color: COLORS.textInvisible, flexShrink: 0 }}>SRC:</span>
        <span className="text-ellipsis" style={{ color: COLORS.textMuted, fontFamily: 'monospace', maxWidth: '200px' }} title={musicRoot}>
          {musicRoot || '(not set)'}
        </span>
        <button
          onClick={() => setPickerTarget('musicRoot')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: COLORS.textDim }}
          title="Change music library path"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span style={{ color: COLORS.textInvisible }}>|</span>

      {/* Output */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
        <span style={{ color: COLORS.textInvisible, flexShrink: 0 }}>OUT:</span>
        <span className="text-ellipsis" style={{ color: COLORS.textMuted, fontFamily: 'monospace', maxWidth: '200px' }} title={displayOutput}>
          {displayOutput || '(not set)'}
        </span>
        <button
          onClick={() => setPickerTarget('output')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: COLORS.textDim }}
          title="Change output folder"
        >
          <FolderOpen size={12} />
        </button>
      </div>

      <span style={{ color: COLORS.textInvisible }}>|</span>

      {/* Output mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          onClick={() => { onOutputModeChange('subfolder'); onSave(); }}
          style={{
            background: outputMode === 'subfolder' ? COLORS.borderLight : 'none',
            border: `1px solid ${outputMode === 'subfolder' ? COLORS.textInvisible : 'transparent'}`,
            borderRadius: '3px',
            padding: '1px 6px',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: FONT,
            color: outputMode === 'subfolder' ? COLORS.text : COLORS.textFaint,
          }}
        >
          subfolder
        </button>
        <button
          onClick={() => { onOutputModeChange('absolute'); onSave(); }}
          style={{
            background: outputMode === 'absolute' ? COLORS.borderLight : 'none',
            border: `1px solid ${outputMode === 'absolute' ? COLORS.textInvisible : 'transparent'}`,
            borderRadius: '3px',
            padding: '1px 6px',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: FONT,
            color: outputMode === 'absolute' ? COLORS.text : COLORS.textFaint,
          }}
        >
          absolute
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

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
