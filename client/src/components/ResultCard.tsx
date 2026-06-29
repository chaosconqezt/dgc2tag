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
      className={`result-card${selected ? ' selected' : ''}`}
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Cover */}
      <div
        ref={imgRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPreview(null)}
        className="result-cover"
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" />
        ) : (
          <Disc3 size={16} className="result-cover-icon" />
        )}
      </div>

      {/* Info — 2 lines */}
      <div className="result-info">
        {/* Line 1: Artist · Year · Label · link */}
        <div className="result-line gap-sm">
          <span className="result-meta text-ellipsis">
            {meta1 || '—'}
          </span>
          <a
            href={url}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="result-link"
          >
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Line 2: Album · Label · track count */}
        <div className="result-line-gap">
          <span className="result-album text-ellipsis">
            {albumName}
          </span>
          {label && (
            <span className="result-label text-ellipsis">
              {label}
            </span>
          )}
          {trackCount != null && (
            <span className="result-tracks">
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
          className="result-preview"
          style={{
            left: preview.x,
            top: preview.y,
            transform: 'translate(-50%, 8px)',
          }}
        />
      )}
    </div>
  );
}
