import { ExternalLink, Disc3, RefreshCw } from 'lucide-react';
import type { SearchResult } from '../types';
import { FONT, FS } from './styles';

interface DgcResultsProps {
  results: SearchResult[];
  loading: boolean;
  selectedResult: SearchResult | null;
  onSelectResult: (result: SearchResult) => void;
}

export function DgcResults({ results, loading, selectedResult, onSelectResult }: DgcResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <div>
      <div style={{ fontSize: FS, color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', paddingLeft: '2px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px' }}>
        DGC · {loading ? '...' : results.length}
        {loading && <RefreshCw size={10} className="animate-spin" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {results.map((res) => (
          <div
            key={res.postId}
            onClick={() => onSelectResult(res)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '6px',
              border: '1px solid',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              backgroundColor: selectedResult?.postId === res.postId ? '#ef444410' : '#111114',
              borderColor: selectedResult?.postId === res.postId ? '#ef4444' : '#1f1f23',
            }}
          >
            {res.coverUrl ? (
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #27272a', position: 'relative' }}>
                <img src={res.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {res.releaseType && (
                  <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: '#000000cc', color: '#ef4444', fontSize: FS, padding: '0 3px', borderRadius: '2px', fontWeight: '600', textTransform: 'uppercase', fontFamily: FONT }}>
                    {res.releaseType}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', backgroundColor: '#000', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Disc3 size={24} color="#3f3f46" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ fontWeight: '600', fontSize: FS, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3', fontFamily: FONT }}>{res.albumName || 'Unknown Album'}</div>
              <div style={{ color: '#ef4444', fontSize: FS, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', fontFamily: FONT }}>{res.artist}</div>
              <div style={{ fontSize: FS, color: '#52525b', display: 'flex', gap: '4px', flexWrap: 'wrap', fontFamily: FONT }}>
                {res.year && <span>{res.year}</span>}
                {res.country && <span>{res.country}</span>}
                {res.label && <span>{res.label}</span>}
              </div>
              {res.genres.length > 0 && (
                <div style={{ fontSize: FS, color: '#3f3f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>
                  {res.genres.slice(0, 2).join(' · ')}
                </div>
              )}
            </div>
            <a
              href={res.url}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#18181b', border: '1px solid #27272a', borderRadius: '3px', padding: '3px', cursor: 'pointer', color: '#71717a', textDecoration: 'none', transition: 'all 0.15s', fontSize: FS, fontFamily: FONT }}
              title="Open on DGC"
            >
              <ExternalLink size={9} /> OPEN
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
