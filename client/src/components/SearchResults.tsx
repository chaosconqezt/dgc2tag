import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult, DiscogsSearchResult } from '../api';
import { DgcResults } from './DgcResults';
import { DeezerResults } from './DeezerResults';
import { MusicBrainzResults } from './MusicBrainzResults';
import { DiscogsResults } from './DiscogsResults';

interface SearchResultsProps {
  results: SearchResult[];
  deezerResults: DeezerSearchResult[];
  mbrainzResults: MusicBrainzSearchResult[];
  discogsResults: DiscogsSearchResult[];
  dgcLoading: boolean;
  deezerLoading: boolean;
  mbrainzLoading: boolean;
  discogsLoading: boolean;
  searchTimeMs: number | null;
  selectedResult: SearchResult | null;
  selectedDeezerId: number | null;
  selectedMbrainzId: string | null;
  selectedDiscogsId: string | null;
  onSelectResult: (result: SearchResult) => void;
  onSelectDeezer: (result: DeezerSearchResult) => void;
  onSelectMbrainz: (result: MusicBrainzSearchResult) => void;
  onSelectDiscogs: (result: DiscogsSearchResult) => void;
}

function sourceBadge(label: string, source: string, count: number, loading: boolean) {
  return (
    <span className="search-source-badge" data-source={source}>
      {label} · {loading ? '...' : count}
    </span>
  );
}

export function SearchResults({ results, deezerResults, mbrainzResults, discogsResults, dgcLoading, deezerLoading, mbrainzLoading, discogsLoading, searchTimeMs, selectedResult, selectedDeezerId, selectedMbrainzId, selectedDiscogsId, onSelectResult, onSelectDeezer, onSelectMbrainz, onSelectDiscogs }: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length + mbrainzResults.length + discogsResults.length;
  const anyLoading = dgcLoading || deezerLoading || mbrainzLoading || discogsLoading;

  return (
    <div className="search-outer">
      <div className="search-header">
        <div className="search-badges-left">
          {results.length > 0 && sourceBadge('DGC', 'dgc', results.length, dgcLoading)}
          {deezerResults.length > 0 && sourceBadge('DEEZER', 'deezer', deezerResults.length, deezerLoading)}
          {mbrainzResults.length > 0 && sourceBadge('MBRAINZ', 'mbrainz', mbrainzResults.length, mbrainzLoading)}
          {discogsResults.length > 0 && sourceBadge('DISCOGS', 'discogs', discogsResults.length, discogsLoading)}
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
      {!anyLoading && totalCount === 0 && !dgcLoading && !deezerLoading && !mbrainzLoading && !discogsLoading ? (
        <div className="search-empty">
          <AlertCircle size={14} className="search-empty-icon" />
          <span>No matches</span>
        </div>
      ) : (
        <div className="col gap-sm">
          <DgcResults results={results} loading={dgcLoading} selectedResult={selectedResult} onSelectResult={onSelectResult} />
          <DeezerResults results={deezerResults} loading={deezerLoading} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          <MusicBrainzResults results={mbrainzResults} loading={mbrainzLoading} selectedId={selectedMbrainzId} onSelect={onSelectMbrainz} />
          <DiscogsResults results={discogsResults} loading={discogsLoading} selectedId={selectedDiscogsId} onSelect={onSelectDiscogs} />
        </div>
      )}
    </div>
  );
}
