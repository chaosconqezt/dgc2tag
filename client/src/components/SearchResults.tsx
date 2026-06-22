import { RefreshCw, AlertCircle } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import { FONT, FS } from './styles';
import { DgcResults } from './DgcResults';
import { DeezerResults } from './DeezerResults';

interface SearchResultsProps {
  results: SearchResult[];
  deezerResults: DeezerSearchResult[];
  loading: boolean;
  selectedResult: SearchResult | null;
  selectedDeezerId: number | null;
  onSelectResult: (result: SearchResult) => void;
  onSelectDeezer: (result: DeezerSearchResult) => void;
  onWebfetch: (url: string) => void;
}

export function SearchResults({ results, deezerResults, loading, selectedResult, selectedDeezerId, onSelectResult, onSelectDeezer, onWebfetch }: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length;

  return (
    <div style={{ width: '220px', minWidth: '220px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #27272a', backgroundColor: '#09090b' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: FS, fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontFamily: FONT }}>MATCHES</h3>
        <span style={{ fontSize: FS, background: '#18181b', padding: '1px 5px', borderRadius: '8px', color: '#71717a', fontFamily: FONT }}>{totalCount}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', color: '#3f3f46' }}>
            <RefreshCw className="animate-spin" size={18} color="#ef4444" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: FS, fontFamily: FONT }}>Searching...</span>
          </div>
        ) : totalCount === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', color: '#3f3f46', textAlign: 'center' }}>
            <AlertCircle size={20} style={{ marginBottom: '6px', opacity: 0.3 }} />
            <p style={{ fontSize: FS, fontFamily: FONT }}>No matches</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DgcResults results={results} selectedResult={selectedResult} onSelectResult={onSelectResult} onWebfetch={onWebfetch} />
            <DeezerResults results={deezerResults} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          </div>
        )}
      </div>
    </div>
  );
}
