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
    <div className="panel row gap-md">
      <label className="label-inline">
        <input type="checkbox" className="cb" checked={artistEnabled} onChange={(e) => onArtistEnabledChange(e.target.checked)} />
        <span>Artist</span>
      </label>
      <div className="cell-fixed" style={{ flex: 1, minWidth: 0 }}>
        <input type="text" value={artist} onChange={(e) => onArtistChange(e.target.value)} placeholder="Artist..." onKeyDown={handleKey} />
      </div>

      <label className="label-inline">
        <input type="checkbox" className="cb" checked={albumEnabled} onChange={(e) => onAlbumEnabledChange(e.target.checked)} />
        <span>Album</span>
      </label>
      <div className="cell-fixed" style={{ flex: 1, minWidth: 0 }}>
        <input type="text" value={album} onChange={(e) => onAlbumChange(e.target.value)} placeholder="Album..." onKeyDown={handleKey} />
      </div>

      <button onClick={onSearch} className="btn btn-primary">
        <Search size={16} />
      </button>
    </div>
  );
}
