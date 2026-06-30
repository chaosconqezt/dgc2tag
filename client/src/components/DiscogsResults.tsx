import type { DiscogsSearchResult } from '../api';
import { ResultCard } from './ResultCard';

interface DiscogsResultsProps {
  results: DiscogsSearchResult[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (result: DiscogsSearchResult) => void;
}

export function DiscogsResults({ results, loading, selectedId, onSelect }: DiscogsResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <>
      {results.map((dg) => (
        <ResultCard
          key={dg.id}
          coverUrl={dg.coverUrl}
          albumName={dg.albumName}
          artist={dg.artist}
          year={dg.year}
          label={dg.label}
          genres={[...dg.genres, ...dg.styles]}
          releaseType={dg.releaseType}
          trackCount={dg.trackCount}
          url={dg.url}
          accentColor="#333333"
          selected={selectedId === dg.id}
          onClick={() => onSelect(dg)}
        />
      ))}
    </>
  );
}
