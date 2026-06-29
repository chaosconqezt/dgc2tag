import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import { DgcResults } from './DgcResults';
import { DeezerResults } from './DeezerResults';
import { MusicBrainzResults } from './MusicBrainzResults';
import { BandcampResults } from './BandcampResults';

interface SearchResultsProps {
  results: SearchResult[];
  deezerResults: DeezerSearchResult[];
  mbrainzResults: MusicBrainzSearchResult[];
  bandcampResults: SearchResult[];
  dgcLoading: boolean;
  deezerLoading: boolean;
  mbrainzLoading: boolean;
  bandcampLoading: boolean;
  searchTimeMs: number | null;
  selectedResult: SearchResult | null;
  selectedDeezerId: number | null;
  selectedMbrainzId: string | null;
  onSelectResult: (result: SearchResult) => void;
  onSelectDeezer: (result: DeezerSearchResult) => void;
  onSelectMbrainz: (result: MusicBrainzSearchResult) => void;
}

function sourceBadge(label: string, source: string, count: number, loading: boolean) {
  return (
    <span className="search-source-badge" data-source={source}>
      {label} · {loading ? '...' : count}
    </span>
  );
}

export function SearchResults({ results, deezerResults, mbrainzResults, bandcampResults, dgcLoading, deezerLoading, mbrainzLoading, bandcampLoading, searchTimeMs, selectedResult, selectedDeezerId, selectedMbrainzId, onSelectResult, onSelectDeezer, onSelectMbrainz }: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length + mbrainzResults.length + bandcampResults.length;
  const anyLoading = dgcLoading || deezerLoading || mbrainzLoading || bandcampLoading;

  return (
    <div className="search-outer">
      <div className="search-header">
        <div className="search-badges-left">
          {results.length > 0 && sourceBadge('DGC', 'dgc', results.length, dgcLoading)}
          {deezerResults.length > 0 && sourceBadge('DEEZER', 'deezer', deezerResults.length, deezerLoading)}
          {mbrainzResults.length > 0 && sourceBadge('MBRAINZ', 'mbrainz', mbrainzResults.length, mbrainzLoading)}
          {bandcampResults.length > 0 && sourceBadge('BANDCAMP', 'bandcamp', bandcampResults.length, bandcampLoading)}
        </div>
        <span className="search-matches-title">MATCHES</span>
        <div className="search-badges-right">
          {anyLoading && <RefreshCw size={10} color="var(--red)" className="animate-spin" />}
          {!anyLoading && searchTimeMs !== null && (
            <span className="search-timer">
              <Clock size={9} />{(searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          <span className="search-total-badge">{totalCount}</span>
        </div>
      </div>
      {!anyLoading && totalCount === 0 && !dgcLoading && !deezerLoading && !mbrainzLoading && !bandcampLoading ? (
        <div className="search-empty">
          <AlertCircle size={14} className="search-empty-icon" />
          <span>No matches</span>
        </div>
      ) : (
        <div className="col gap-sm">
          <DgcResults results={results} loading={dgcLoading} selectedResult={selectedResult} onSelectResult={onSelectResult} />
          <DeezerResults results={deezerResults} loading={deezerLoading} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          <MusicBrainzResults results={mbrainzResults} loading={mbrainzLoading} selectedId={selectedMbrainzId} onSelect={onSelectMbrainz} />
          <BandcampResults results={bandcampResults} loading={bandcampLoading} selectedUrl={selectedResult?.source === 'bandcamp' ? selectedResult.url : null} onSelect={onSelectResult} />
        </div>
      )}
    </div>
  );
}
