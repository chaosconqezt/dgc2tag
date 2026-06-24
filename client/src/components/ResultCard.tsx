import { useState, useRef } from 'react';
import { Disc3, ExternalLink } from 'lucide-react';
import { FONT, FS } from './styles';

interface ResultCardProps {
  coverUrl: string | null;
  albumName: string;
  artist: string;
  year?: string | null;
  country?: string | null;
  label?: string | null;
  genres?: string[];
  releaseType?: string | null;
  trackCount?: number;
  url: string;
  accentColor: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ResultCard({ coverUrl, albumName, artist, year, country, label, genres, releaseType, trackCount, url, accentColor, selected, onClick }: ResultCardProps) {
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (!coverUrl || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setPreview({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '6px',
        border: `1px solid ${selected ? accentColor : '#1f1f23'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: selected ? `${accentColor}10` : '#111114',
        minWidth: 0,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {coverUrl ? (
        <div
          ref={imgRef}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setPreview(null)}
          style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #27272a', flexShrink: 0, position: 'relative' }}
        >
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {releaseType && (
            <div style={{ position: 'absolute', bottom: '1px', left: '1px', background: '#000000cc', color: accentColor, fontSize: '10px', padding: '0 2px', borderRadius: '2px', fontWeight: '600', textTransform: 'uppercase', fontFamily: FONT }}>
              {releaseType}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: '60px', height: '60px', borderRadius: '4px', backgroundColor: '#000', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Disc3 size={20} color="#3f3f46" />
        </div>
      )}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: FS, color: accentColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>{artist}</div>
        <div style={{ fontWeight: '500', fontSize: FS, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>{albumName}</div>
        <div style={{ fontSize: FS, color: '#52525b', display: 'flex', gap: '4px', fontFamily: FONT }}>
          {year && <span>{year}</span>}
          {country && <span>{country}</span>}
          {label && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
          {trackCount != null && <span>{trackCount}t</span>}
        </div>
        {genres && genres.length > 0 && (
          <div style={{ fontSize: FS, color: '#3f3f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FONT }}>
            {genres.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>

      <a
        href={url}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f4f4f5')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#3f3f46')}
        style={{ position: 'absolute', bottom: '4px', right: '4px', color: '#3f3f46', transition: 'color 0.15s', display: 'flex' }}
        title="Open on DGC"
      >
        <ExternalLink size={12} />
      </a>

      {preview && coverUrl && (
        <img
          src={coverUrl}
          alt=""
          style={{
            position: 'fixed',
            left: preview.x,
            top: preview.y,
            transform: 'translate(-50%, 8px)',
            maxWidth: '300px',
            maxHeight: '300px',
            borderRadius: '6px',
            border: '1px solid #27272a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}
