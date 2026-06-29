import type { MusicBrainzSearchResult } from '../api';
import { ResultCard } from './ResultCard';

interface MusicBrainzResultsProps {
  results: MusicBrainzSearchResult[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (result: MusicBrainzSearchResult) => void;
}

export function MusicBrainzResults({ results, loading, selectedId, onSelect }: MusicBrainzResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <>
      {results.map((mb) => (
        <ResultCard
          key={mb.releaseId}
          coverUrl={null}
          albumName={mb.title}
          artist={mb.artist}
          year={mb.year}
          label={mb.label}
          genres={mb.tags?.slice(0, 3)}
          releaseType={mb.releaseType}
          trackCount={mb.trackCount}
          url={mb.url}
          accentColor="var(--orange)"
          selected={selectedId === mb.releaseId}
          onClick={() => onSelect(mb)}
        />
      ))}
    </>
  );
}
