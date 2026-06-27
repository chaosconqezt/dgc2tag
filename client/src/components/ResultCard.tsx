import { useState, useRef } from 'react';
import { Disc3, ExternalLink, Music2 } from 'lucide-react';

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

export function ResultCard({
  coverUrl,
  albumName,
  artist,
  year,
  label,
  trackCount,
  url,
  accentColor,
  selected,
  onClick,
}: ResultCardProps) {
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (!coverUrl || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    setPreview({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const meta1 = [artist, year].filter(Boolean).join(' · ');

  return (
    <div
      onClick={onClick}
      className="result-card"
      style={{
        border: `1px solid ${selected ? accentColor : 'var(--border-light)'}`,
        backgroundColor: selected ? `${accentColor}15` : 'transparent',
      }}
    >
      {/* Cover */}
      <div
        ref={imgRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPreview(null)}
        className="result-card-cover"
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" />
        ) : (
          <Disc3 size={16} color="var(--text-invisible)" />
        )}
      </div>

      {/* Info — 2 lines */}
      <div className="result-card-info">
        {/* Line 1: Artist · Year · Label · link */}
        <div className="result-card-line">
          <span
            className="text-ellipsis"
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: accentColor,
              fontFamily: 'var(--font)',
              flex: 1,
              minWidth: 0,
            }}
          >
            {meta1 || '—'}
          </span>
          <a
            href={url}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="result-card-link"
          >
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Line 2: Album · Label · track count */}
        <div className="result-card-line2">
          <span
            className="text-ellipsis"
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font)',
              flex: 1,
              minWidth: 0,
            }}
          >
            {albumName}
          </span>
          {label && (
            <span className="text-ellipsis result-card-label">
              {label}
            </span>
          )}
          {trackCount != null && (
            <span className="result-card-trackcount">
              <Music2 size={10} />
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
          className="result-card-preview"
          style={{
            left: preview.x,
            top: preview.y,
          }}
        />
      )}
    </div>
  );
}
