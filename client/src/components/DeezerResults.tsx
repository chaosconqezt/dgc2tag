import type { DeezerSearchResult } from '../types';
import { ResultCard } from './ResultCard';

interface DeezerResultsProps {
  results: DeezerSearchResult[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (result: DeezerSearchResult) => void;
}

export function DeezerResults({ results, loading, selectedId, onSelect }: DeezerResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <>
      {results.map((dz) => (
        <ResultCard
          key={dz.albumId}
          coverUrl={dz.coverUrl}
          albumName={dz.albumName}
          artist={dz.artist}
          year={dz.year}
          label={dz.label}
          genres={[]}
          releaseType={dz.releaseType}
          trackCount={dz.trackCount}
          url={dz.url}
            sourceId="deezer"
          selected={selectedId === dz.albumId}
          onClick={() => onSelect(dz)}
        />
      ))}
    </>
  );
}
