import { Search } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

interface SearchBarProps {
  artist: string;
  album: string;
  artistEnabled: boolean;
  albumEnabled: boolean;
  onArtistChange: (v: string) => void;
  onAlbumChange: (v: string) => void;
  onArtistEnabledChange: (v: boolean) => void;
  onAlbumEnabledChange: (v: boolean) => void;
  onSearch: () => void;
}

export function SearchBar({
  artist, album, artistEnabled, albumEnabled,
  onArtistChange, onAlbumChange,
  onArtistEnabledChange, onAlbumEnabledChange,
  onSearch,
}: SearchBarProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '12px',
      flexShrink: 0,
    }}>
      {/* Artist group */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        cursor: 'pointer', flexShrink: 0, userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={artistEnabled}
          onChange={(e) => onArtistEnabledChange(e.target.checked)}
          style={{ accentColor: COLORS.red, margin: 0 }}
        />
        <span style={{ fontSize: '11px', color: COLORS.textDim, fontFamily: FONT }}>Artist</span>
      </label>
      <input
        type="text"
        value={artist}
        onChange={(e) => onArtistChange(e.target.value)}
        placeholder="Artist..."
        onKeyDown={handleKey}
        style={{
          flex: '1 1 0', minWidth: 0, boxSizing: 'border-box',
          background: COLORS.inputBg, border: `1px solid ${COLORS.textInvisible}`,
          borderRadius: '6px', padding: '6px 10px', color: COLORS.text,
          fontSize: FS, outline: 'none', fontFamily: FONT,
        }}
      />

      {/* Album group */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        cursor: 'pointer', flexShrink: 0, userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={albumEnabled}
          onChange={(e) => onAlbumEnabledChange(e.target.checked)}
          style={{ accentColor: COLORS.red, margin: 0 }}
        />
        <span style={{ fontSize: '11px', color: COLORS.textDim, fontFamily: FONT }}>Album</span>
      </label>
      <input
        type="text"
        value={album}
        onChange={(e) => onAlbumChange(e.target.value)}
        placeholder="Album..."
        onKeyDown={handleKey}
        style={{
          flex: '1 1 0', minWidth: 0, boxSizing: 'border-box',
          background: COLORS.inputBg, border: `1px solid ${COLORS.textInvisible}`,
          borderRadius: '6px', padding: '6px 10px', color: COLORS.text,
          fontSize: FS, outline: 'none', fontFamily: FONT,
        }}
      />

      {/* Search button */}
      <button
        onClick={onSearch}
        className="btn-primary"
        style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
      >
        <Search size={16} />
      </button>
    </div>
  );
}
