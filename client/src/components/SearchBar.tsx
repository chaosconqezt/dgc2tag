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
    <div className="panel search-bar">
      <label className="search-field">
        <input type="checkbox" className="cb" checked={artistEnabled} onChange={(e) => onArtistEnabledChange(e.target.checked)} />
        <span className="search-field-label">Artist</span>
      </label>
      <input type="text" className="search-input" value={artist} onChange={(e) => onArtistChange(e.target.value)} placeholder="Artist..." onKeyDown={handleKey} />

      <label className="search-field">
        <input type="checkbox" className="cb" checked={albumEnabled} onChange={(e) => onAlbumEnabledChange(e.target.checked)} />
        <span className="search-field-label">Album</span>
      </label>
      <input type="text" className="search-input" value={album} onChange={(e) => onAlbumChange(e.target.value)} placeholder="Album..." onKeyDown={handleKey} />

      <button onClick={onSearch} className="btn-primary search-btn">
        <Search size={16} />
      </button>
    </div>
  );
}
