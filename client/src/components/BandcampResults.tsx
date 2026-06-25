import type { SearchResult } from '../types';
import { ResultCard } from './ResultCard';

interface BandcampResultsProps {
  results: SearchResult[];
  loading: boolean;
  selectedUrl: string | null;
  onSelect: (result: SearchResult) => void;
}

export function BandcampResults({ results, loading, selectedUrl, onSelect }: BandcampResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <>
      {results.map((res) => (
        <ResultCard
          key={res.url}
          coverUrl={res.coverUrl}
          albumName={res.albumName || 'Unknown Album'}
          artist={res.artist}
          year={res.year}
          label={res.label}
          genres={res.genres}
          releaseType={res.releaseType}
          url={res.url}
          accentColor="#629aa9"
          selected={selectedUrl === res.url}
          onClick={() => onSelect(res)}
        />
      ))}
    </>
  );
}
