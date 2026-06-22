import { ExternalLink, Disc3 } from 'lucide-react';
import type { DeezerSearchResult } from '../types';
import { FONT, FS } from './styles';

interface DeezerResultsProps {
  results: DeezerSearchResult[];
  selectedId: number | null;
  onSelect: (result: DeezerSearchResult) => void;
}

export function DeezerResults({ results, selectedId, onSelect }: DeezerResultsProps) {
  if (results.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: FS, color: '#4ade80', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', paddingLeft: '2px', fontFamily: FONT }}>
        DEEZER · {results.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {results.map((dz) => (
          <div
            key={dz.albumId}
            onClick={() => onSelect(dz)}
            style={{
              display: 'flex',
              gap: '6px',
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
              <img src={dz.coverUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '4px', backgroundColor: '#000', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Disc3 size={16} color="#3f3f46" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ fontWeight: '600', fontSize: FS, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>{dz.albumName}</div>
              <div style={{ color: '#4ade80', fontSize: FS, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>{dz.artist}</div>
              <div style={{ fontSize: FS, color: '#52525b', display: 'flex', gap: '4px', fontFamily: FONT }}>
                {dz.year && <span>{dz.year}</span>}
                {dz.releaseType && <span style={{ color: '#4ade80', textTransform: 'uppercase', fontWeight: '600' }}>{dz.releaseType}</span>}
                {dz.label && <span>{dz.label}</span>}
                <span>{dz.trackCount} tracks</span>
              </div>
            </div>
            <a
              href={dz.url}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              style={{ alignSelf: 'flex-start', background: '#18181b', border: '1px solid #27272a', borderRadius: '3px', padding: '3px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#71717a', textDecoration: 'none', fontSize: FS, fontFamily: FONT }}
              title="Open on Deezer"
            >
              <ExternalLink size={9} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
