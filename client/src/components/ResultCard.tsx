import { useState, useRef } from 'react';
import { Disc3, ExternalLink, Music2 } from 'lucide-react';
import { FONT, FS, COLORS } from './styles';

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
      style={{
        display: 'flex',
        gap: '8px',
        padding: '5px',
        border: `1px solid ${selected ? accentColor : COLORS.borderLight}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        backgroundColor: selected ? `${accentColor}15` : 'transparent',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Cover */}
      <div
        ref={imgRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setPreview(null)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          border: `1px solid ${COLORS.border}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Disc3 size={16} color={COLORS.textInvisible} />
        )}
      </div>

      {/* Info — 2 lines */}
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px', overflow: 'hidden' }}>
        {/* Line 1: Artist · Year · Label · link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
          <span
            style={{
              fontWeight: '600',
              fontSize: FS,
              color: accentColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: FONT,
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
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textInvisible)}
            style={{ color: COLORS.textInvisible, flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}
          >
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Line 2: Album · Label · track count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span
            style={{
              fontSize: FS,
              color: COLORS.textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: FONT,
              flex: 1,
              minWidth: 0,
            }}
          >
            {albumName}
          </span>
          {label && (
            <span style={{ fontSize: FS, color: COLORS.textFaint, fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {label}
            </span>
          )}
          {trackCount != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: FS, color: COLORS.textFaint, fontFamily: FONT, flexShrink: 0 }}>
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
          style={{
            position: 'fixed',
            left: preview.x,
            top: preview.y,
            transform: 'translate(-50%, 8px)',
            maxWidth: '300px',
            maxHeight: '300px',
            borderRadius: '6px',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}
