import { useState, useRef } from 'react';
import { Disc3, ExternalLink, Music2 } from 'lucide-react';

interface ResultCardProps {
  coverUrl: string | null;
  albumName: string;
  artist: string;
  year?: string | null;
  label?: string | null;
  trackCount?: number;
  url: string;
  accentColor: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ResultCard({
  coverUrl, albumName, artist, year, label, trackCount,
  url, accentColor, selected, onClick,
}: ResultCardProps) {
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (!coverUrl || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const PRW = 300;
    const half = PRW / 2;
    let x = rect.left + rect.width / 2;
    x = Math.max(half, Math.min(x, window.innerWidth - half));
    setPreview({ x, y: rect.top });
  };

  const meta1 = [artist, year].filter(Boolean).join(' · ');

  return (
    <div
      onClick={onClick}
      className="row hover-bg"
      style={{
        cursor: 'pointer',
        gap: 4,
        padding: '1px 4px',
        border: selected ? `1px solid ${accentColor}` : '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        position: 'relative',
      }}
    >
      {/* Cover */}
      <div
        ref={imgRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPreview(null)}
        style={{
          width: 22, height: 22, flexShrink: 0, borderRadius: 2, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-alt)',
        }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" style={{ width: 22, height: 22, objectFit: 'cover' }} />
        ) : (
          <Disc3 size={14} style={{ color: 'var(--text-faint)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1" style={{ minWidth: 0, lineHeight: 1.4 }}>
        <div className="row gap-sm">
          <span className="text-ellipsis" style={{ color: accentColor }}>
            {meta1 || '\u2014'}
          </span>
          <a href={url} target="_blank" onClick={(e) => e.stopPropagation()}
            style={{ flexShrink: 0, color: 'var(--text-dim)', display: 'flex' }}>
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="row gap-sm">
          <span className="text-ellipsis" style={{ color: 'var(--text-dim)' }}>
            {albumName}
          </span>
          {trackCount != null && (
            <span className="row" style={{ gap: 2, flexShrink: 0, color: 'var(--text-dim)' }}>
              <Music2 size={9} />
              {trackCount}
            </span>
          )}
        </div>
      </div>

      {/* Preview popup */}
      {preview && coverUrl && (
        <img
          src={coverUrl}
          alt=""
          style={{
            position: 'fixed', left: preview.x, top: preview.y,
            transform: 'translate(-50%, 8px)', zIndex: 9999,
            width: 300, borderRadius: 'var(--radius)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        />
      )}
    </div>
  );
}
