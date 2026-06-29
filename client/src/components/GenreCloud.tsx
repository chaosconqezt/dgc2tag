import { useMemo } from 'react';

interface GenreCloudProps {
  genres: [string, number][];
  selectedGenre: string | null;
  onSelect: (genre: string | null) => void;
}

const MAX_TAGS = 60;

export function GenreCloud({ genres, selectedGenre, onSelect }: GenreCloudProps) {
  const items = useMemo(() => {
    const list = genres.slice(0, MAX_TAGS);
    const max = list.length > 0 ? list[0][1] : 1;
    return list.map(([name, count]) => ({
      name,
      weight: count / max,
    }));
  }, [genres]);

  if (items.length === 0) return null;

  return (
    <div className="genre-cloud">
      {items.map(({ name, weight }) => (
        <span
          key={name}
          className={`genre-tag${selectedGenre === name ? ' selected' : ''}`}
          style={{ '--tw': weight } as React.CSSProperties}
          onClick={() => onSelect(selectedGenre === name ? null : name)}
        >
          {name}
        </span>
      ))}
    </div>
  );
}
