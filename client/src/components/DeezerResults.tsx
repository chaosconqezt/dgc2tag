import { ExternalLink, Disc3, RefreshCw } from 'lucide-react';
import type { DeezerSearchResult } from '../types';
import { FONT, FS } from './styles';

interface DeezerResultsProps {
  results: DeezerSearchResult[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (result: DeezerSearchResult) => void;
}

export function DeezerResults({ results, loading, selectedId, onSelect }: DeezerResultsProps) {
  if (results.length === 0 && !loading) return null;

  return (
    <div>
      <div style={{ fontSize: FS, color: '#4ade80', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', paddingLeft: '2px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px' }}>
        DEEZER · {loading ? '...' : results.length}
        {loading && <RefreshCw size={10} className="animate-spin" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {results.map((dz) => (
          <div
            key={dz.albumId}
            onClick={() => onSelect(dz)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '6px',
              border: '1px solid',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              backgroundColor: selectedId === dz.albumId ? '#4ade8010' : '#111114',
              borderColor: selectedId === dz.albumId ? '#4ade80' : '#1f1f23',
            }}
          >
            {dz.coverUrl ? (
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #27272a', position: 'relative' }}>
                <img src={dz.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {dz.releaseType && (
                  <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: '#000000cc', color: '#4ade80', fontSize: FS, padding: '0 3px', borderRadius: '2px', fontWeight: '600', textTransform: 'uppercase', fontFamily: FONT }}>
                    {dz.releaseType}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: '4px', backgroundColor: '#000', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Disc3 size={24} color="#3f3f46" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ fontWeight: '600', fontSize: FS, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3', fontFamily: FONT }}>{dz.albumName}</div>
              <div style={{ color: '#4ade80', fontSize: FS, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', fontFamily: FONT }}>{dz.artist}</div>
              <div style={{ fontSize: FS, color: '#52525b', display: 'flex', gap: '4px', flexWrap: 'wrap', fontFamily: FONT }}>
                {dz.year && <span>{dz.year}</span>}
                {dz.label && <span>{dz.label}</span>}
                <span>{dz.trackCount} tracks</span>
              </div>
            </div>
            <a
              href={dz.url}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', background: '#18181b', border: '1px solid #27272a', borderRadius: '3px', padding: '3px', cursor: 'pointer', color: '#71717a', textDecoration: 'none', transition: 'all 0.15s', fontSize: FS, fontFamily: FONT }}
              title="Open on Deezer"
            >
              <ExternalLink size={9} /> OPEN
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
