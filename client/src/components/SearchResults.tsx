import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import { FONT, FS, COLORS } from './styles';
import { DgcResults } from './DgcResults';
import { DeezerResults } from './DeezerResults';

interface SearchResultsProps {
  results: SearchResult[];
  deezerResults: DeezerSearchResult[];
  dgcLoading: boolean;
  deezerLoading: boolean;
  searchTimeMs: number | null;
  selectedResult: SearchResult | null;
  selectedDeezerId: number | null;
  onSelectResult: (result: SearchResult) => void;
  onSelectDeezer: (result: DeezerSearchResult) => void;
}

export function SearchResults({ results, deezerResults, dgcLoading, deezerLoading, searchTimeMs, selectedResult, selectedDeezerId, onSelectResult, onSelectDeezer }: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length;
  const anyLoading = dgcLoading || deezerLoading;

  return (
    <div style={{ width: '220px', minWidth: '220px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #27272a', backgroundColor: '#09090b' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: FS, fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontFamily: FONT }}>MATCHES</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {anyLoading && <RefreshCw size={10} color="#ef4444" className="animate-spin" />}
          {!anyLoading && searchTimeMs !== null && (
            <span style={{ fontSize: '12px', color: COLORS.textDim, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Clock size={9} />{(searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          <span style={{ fontSize: FS, background: '#18181b', padding: '1px 5px', borderRadius: '8px', color: '#71717a', fontFamily: FONT }}>{totalCount}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {!anyLoading && totalCount === 0 && !dgcLoading && !deezerLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', color: '#3f3f46', textAlign: 'center' }}>
            <AlertCircle size={20} style={{ marginBottom: '6px', opacity: 0.3 }} />
            <p style={{ fontSize: FS, fontFamily: FONT }}>No matches</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DgcResults results={results} loading={dgcLoading} selectedResult={selectedResult} onSelectResult={onSelectResult} />
            <DeezerResults results={deezerResults} loading={deezerLoading} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          </div>
        )}
      </div>
    </div>
  );
}
