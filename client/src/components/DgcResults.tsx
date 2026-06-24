import type { SearchResult } from '../types';
import { ResultCard } from './ResultCard';

interface DgcResultsProps {
  results: SearchResult[];
  loading: boolean;
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
}

export function DgcResults({ results, loading, selectedResult, onSelectResult }: DgcResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <>
      {results.map((res) => (
        <ResultCard
          key={res.postId}
          coverUrl={res.coverUrl}
          albumName={res.albumName || 'Unknown Album'}
          artist={res.artist}
          year={res.year}
          country={res.country}
          label={res.label}
          genres={[]}
          releaseType={res.releaseType}
          url={res.url}
          urlTitle="Open on DGC"
          accentColor="#ef4444"
          selected={selectedResult?.postId === res.postId}
          onClick={() => onSelectResult(res)}
        />
      ))}
    </>
  );
}
