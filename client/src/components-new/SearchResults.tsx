import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { SearchResult, DeezerSearchResult } from '../types';
import type { MusicBrainzSearchResult, DiscogsSearchResult } from '../api';
import { ResultCard } from './ResultCard';

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

function SourceBadge({ label, source, count, loading }: { label: string; source: string; count: number; loading: boolean }) {
  const colors: Record<string, string> = {
    dgc: 'var(--accent)',
    deezer: 'var(--green)',
    mbrainz: 'var(--orange)',
    discogs: 'var(--purple)',
  };
  return (
    <span style={{ fontSize: 10, color: colors[source] || 'var(--text-faint)' }}>
      {label} &middot; {loading ? '...' : count}
    </span>
  );
}

export function SearchResults({
  results, deezerResults, mbrainzResults, discogsResults,
  dgcLoading, deezerLoading, mbrainzLoading, discogsLoading,
  searchTimeMs, selectedResult, selectedDeezerId, selectedMbrainzId, selectedDiscogsId,
  onSelectResult, onSelectDeezer, onSelectMbrainz, onSelectDiscogs,
}: SearchResultsProps) {
  const totalCount = results.length + deezerResults.length + mbrainzResults.length + discogsResults.length;
  const anyLoading = dgcLoading || deezerLoading || mbrainzLoading || discogsLoading;

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ padding: '6px var(--gap-lg)', borderBottom: '1px solid var(--border)', gap: 6 }}>
        <div className="row" style={{ gap: 6, flex: 1, minWidth: 0 }}>
          {results.length > 0 && <SourceBadge label="DGC" source="dgc" count={results.length} loading={dgcLoading} />}
          {deezerResults.length > 0 && <SourceBadge label="DEEZER" source="deezer" count={deezerResults.length} loading={deezerLoading} />}
          {mbrainzResults.length > 0 && <SourceBadge label="MBRAINZ" source="mbrainz" count={mbrainzResults.length} loading={mbrainzLoading} />}
          {discogsResults.length > 0 && <SourceBadge label="DISCOGS" source="discogs" count={discogsResults.length} loading={discogsLoading} />}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-faint)' }}>MATCHES</span>
        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
          {anyLoading && <RefreshCw size={10} color="var(--accent)" className="spin" />}
          {!anyLoading && searchTimeMs !== null && (
            <span className="row" style={{ gap: 2, color: 'var(--text-faint)', fontSize: 10 }}>
              <Clock size={9} />{(searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{totalCount}</span>
        </div>
      </div>

      {/* Content */}
      {!anyLoading && totalCount === 0 ? (
        <div className="row col" style={{ alignItems: 'center', padding: '20px', gap: 4, color: 'var(--text-faint)', textAlign: 'center' }}>
          <AlertCircle size={14} />
          <span style={{ fontSize: 12 }}>No matches</span>
        </div>
      ) : (
        <div className="col gap-sm" style={{ padding: 'var(--gap-lg)' }}>
          {results.map((res) => (
            <ResultCard
              key={res.postId}
              coverUrl={res.coverUrl}
              albumName={res.albumName || 'Unknown Album'}
              artist={res.artist}
              year={res.year}
              label={res.label}
              trackCount={undefined}
              url={res.url}
              accentColor="var(--accent)"
              selected={selectedResult?.postId === res.postId}
              onClick={() => onSelectResult(res)}
            />
          ))}
          {deezerResults.map((dz) => (
            <ResultCard
              key={dz.albumId}
              coverUrl={dz.coverUrl}
              albumName={dz.albumName}
              artist={dz.artist}
              year={dz.year}
              label={dz.label}
              trackCount={dz.trackCount}
              url={dz.url}
              accentColor="var(--green)"
              selected={selectedDeezerId === dz.albumId}
              onClick={() => onSelectDeezer(dz)}
            />
          ))}
          {mbrainzResults.map((mb) => (
            <ResultCard
              key={mb.releaseId}
              coverUrl={null}
              albumName={mb.title}
              artist={mb.artist}
              year={mb.year}
              label={mb.label}
              trackCount={mb.trackCount}
              url={mb.url}
              accentColor="var(--orange)"
              selected={selectedMbrainzId === mb.releaseId}
              onClick={() => onSelectMbrainz(mb)}
            />
          ))}
          {discogsResults.map((dg) => (
            <ResultCard
              key={dg.id}
              coverUrl={dg.coverUrl}
              albumName={dg.albumName}
              artist={dg.artist}
              year={dg.year}
              label={dg.label}
              trackCount={dg.trackCount}
              url={dg.url}
              accentColor="#a78bfa"
              selected={selectedDiscogsId === dg.id}
              onClick={() => onSelectDiscogs(dg)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
