import { Search } from 'lucide-react';

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
    <div className="search-bar">
      <label className="search-check-label">
        <input
          type="checkbox"
          checked={artistEnabled}
          onChange={(e) => onArtistEnabledChange(e.target.checked)}
        />
        <span className="search-check-text">Artist</span>
      </label>
      <input
        type="text"
        value={artist}
        onChange={(e) => onArtistChange(e.target.value)}
        placeholder="Artist..."
        onKeyDown={handleKey}
        className="search-input"
      />

      <label className="search-check-label">
        <input
          type="checkbox"
          checked={albumEnabled}
          onChange={(e) => onAlbumEnabledChange(e.target.checked)}
        />
        <span className="search-check-text">Album</span>
      </label>
      <input
        type="text"
        value={album}
        onChange={(e) => onAlbumChange(e.target.value)}
        placeholder="Album..."
        onKeyDown={handleKey}
        className="search-input"
      />

      <button onClick={onSearch} className="btn-primary search-btn">
        <Search size={16} />
      </button>
    </div>
  );
}
