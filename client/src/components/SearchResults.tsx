import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult } from '../api';
import { FONT, FS, COLORS } from './styles';
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
    <div style={{ marginBottom: '8px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '8px', overflow: 'hidden', minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px', position: 'absolute', left: 0 }}>
          {results.length > 0 && (
            <span style={{ fontSize: '10px', color: COLORS.red, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>
              DGC · {dgcLoading ? '...' : results.length}
            </span>
          )}
          {deezerResults.length > 0 && (
            <span style={{ fontSize: '10px', color: COLORS.green, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>
              DEEZER · {deezerLoading ? '...' : deezerResults.length}
            </span>
          )}
          {mbrainzResults.length > 0 && (
            <span style={{ fontSize: '10px', color: '#f97316', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>
              MBRAINZ · {mbrainzLoading ? '...' : mbrainzResults.length}
            </span>
          )}
          {bandcampResults.length > 0 && (
            <span style={{ fontSize: '10px', color: '#629aa9', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: FONT }}>
              BANDCAMP · {bandcampLoading ? '...' : bandcampResults.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: FS, fontWeight: '700', color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: FONT, width: '100%', textAlign: 'center' }}>MATCHES</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'absolute', right: 0 }}>
          {anyLoading && <RefreshCw size={10} color={COLORS.red} className="animate-spin" />}
          {!anyLoading && searchTimeMs !== null && (
            <span style={{ fontSize: '12px', color: COLORS.textDim, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Clock size={9} />{(searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          <span style={{ fontSize: FS, background: COLORS.inputBg, padding: '1px 5px', borderRadius: '8px', color: COLORS.textDim, fontFamily: FONT }}>{totalCount}</span>
        </div>
      </div>
      {!anyLoading && totalCount === 0 && !dgcLoading && !deezerLoading && !mbrainzLoading && !bandcampLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px', color: COLORS.textInvisible, gap: '6px' }}>
          <AlertCircle size={14} style={{ opacity: 0.3 }} />
          <span style={{ fontSize: FS, fontFamily: FONT }}>No matches</span>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
        >
          <DgcResults results={results} loading={dgcLoading} selectedResult={selectedResult} onSelectResult={onSelectResult} />
          <DeezerResults results={deezerResults} loading={deezerLoading} selectedId={selectedDeezerId} onSelect={onSelectDeezer} />
          <MusicBrainzResults results={mbrainzResults} loading={mbrainzLoading} selectedId={selectedMbrainzId} onSelect={onSelectMbrainz} />
          <BandcampResults results={bandcampResults} loading={bandcampLoading} selectedUrl={selectedResult?.source === 'bandcamp' ? selectedResult.url : null} onSelect={onSelectResult} />
        </div>
      )}
    </div>
  );
}
