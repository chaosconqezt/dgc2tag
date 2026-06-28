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

export function SearchResults({ results, deezerResults, mbrainzResults, bandcampResults, dgcLoading, deezerLoading, mbrainzLoading, bandcampLoading, searchTimeMs, selectedResult, selectedDeezerId, selectedMbrainzId, onSelectResult, onSelectDeezer, onSelectMbrainz }: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length + mbrainzResults.length + bandcampResults.length;
  const anyLoading = dgcLoading || deezerLoading || mbrainzLoading || bandcampLoading;

  return (
    <div className="search-results-section">
      <div className="search-results-header">
        <div className="search-results-badges">
          {results.length > 0 && (
            <span className="search-results-badge text-red">
              DGC · {dgcLoading ? '...' : results.length}
            </span>
          )}
          {deezerResults.length > 0 && (
            <span className="search-results-badge text-green">
              DEEZER · {deezerLoading ? '...' : deezerResults.length}
            </span>
          )}
          {mbrainzResults.length > 0 && (
            <span className="search-results-badge text-mbrainz">
              MBRAINZ · {mbrainzLoading ? '...' : mbrainzResults.length}
            </span>
          )}
          {bandcampResults.length > 0 && (
            <span className="search-results-badge text-bandcamp">
              BANDCAMP · {bandcampLoading ? '...' : bandcampResults.length}
            </span>
          )}
        </div>
        <span className="search-results-center">MATCHES</span>
        <div className="search-results-right">
          {anyLoading && <RefreshCw size={10} className="animate-spin text-red" />}
          {!anyLoading && searchTimeMs !== null && (
            <span className="search-results-timing">
              <Clock size={9} />{(searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          <span className="search-results-count">{totalCount}</span>
        </div>
      </div>
      {!anyLoading && totalCount === 0 && !dgcLoading && !deezerLoading && !mbrainzLoading && !bandcampLoading ? (
        <div className="search-results-empty">
          <AlertCircle size={14} />
          <span className="search-results-empty-text">No matches</span>
        </div>
      ) : (
        <div className="search-results-list">
          <DgcResults results={results} loading={dgcLoading} selectedResult={selectedResult} onSelectResult={onSelectResult} />
          <DeezerResults results={deezerResults} loading={deezerLoading} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          <MusicBrainzResults results={mbrainzResults} loading={mbrainzLoading} selectedId={selectedMbrainzId} onSelect={onSelectMbrainz} />
          <BandcampResults results={bandcampResults} loading={bandcampLoading} selectedUrl={selectedResult?.source === 'bandcamp' ? selectedResult.url : null} onSelect={onSelectResult} />
        </div>
      )}
    </div>
  );
}
