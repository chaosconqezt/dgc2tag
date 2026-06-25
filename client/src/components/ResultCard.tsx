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
  country,
  label,
  genres,
  releaseType,
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

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '6px',
        border: `1px solid ${selected ? accentColor : COLORS.borderLight}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: selected ? `${accentColor}10` : COLORS.bg,
        minWidth: 0,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Cover image */}
      {coverUrl ? (
        <div
          ref={imgRef}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setPreview(null)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#000',
            border: `1px solid ${COLORS.border}`,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <img
            src={coverUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Existing release‑type badge (kept for compatibility) */}
          {releaseType && (
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                left: '1px',
                background: 'rgba(0,0,0,0.8)',
                color: accentColor,
                fontSize: '10px',
                padding: '0 2px',
                borderRadius: '2px',
                fontWeight: '600',
                textTransform: 'uppercase',
                fontFamily: FONT,
              }}
            >
              {releaseType}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '4px',
            backgroundColor: '#000',
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Disc3 size={20} color={COLORS.textInvisible} />
        </div>
      )}

      {/* Text column */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
        {/* Artist */}
        <div
          style={{
            fontWeight: '600',
            fontSize: FS,
            color: accentColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: FONT,
          }}
        >
          {artist}
        </div>

        {/* Album title */}
        <div
          style={{
            fontWeight: '500',
            fontSize: FS,
            color: COLORS.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: FONT,
          }}
        >
          {albumName}
        </div>

        {/* Year / Release type line (small, muted) */}
        {(year || releaseType) && (
          <div
            style={{
              fontSize: FS,
              color: COLORS.textFaint, // analogue of --text-muted
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {year && <span>{year}</span>}
            {year && releaseType && <span>·</span>}
            {releaseType && <span>{releaseType}</span>}
          </div>
        )}

        {/* Country / Label line (unchanged, but without year/trackCount) */}
        <div
          style={{
            fontSize: FS,
            color: COLORS.textFaint,
            display: 'flex',
            gap: '4px',
            fontFamily: FONT,
          }}
        >
          {country && <span>{country}</span>}
          {label && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          )}
        </div>

        {/* Genres as pill‑chips */}
        {genres && genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
            {genres.slice(0, 2).map((g, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: 'var(--genre-bg, #374151)', // fallback dark‑gray
                  color: 'var(--genre-text, #fff)',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {g}
              </span>
            ))}
            {genres.length > 2 && (
              <span
                style={{
                  backgroundColor: 'var(--genre-bg, #374151)',
                  color: 'var(--genre-text, #fff)',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                +{genres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* External link (top‑right) */}
      <a
        href={url}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textInvisible)}
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          color: COLORS.textInvisible,
          transition: 'color 0.15s',
          display: 'flex',
          title: 'Open on DGC',
        }}
      >
        <ExternalLink size={12} />
      </a>

      {/* Track‑count badge (bottom‑right, inside the card) */}
      {trackCount != null && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '28px', // space for the external link icon
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: FS,
            color: COLORS.textFaint,
            fontFamily: FONT,
          }}
        >
          <Music2 size={12} color={COLORS.textFaint} />
          <span>{trackCount}</span>
        </div>
      )}

      {/* Preview popup (hover over cover) */}
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