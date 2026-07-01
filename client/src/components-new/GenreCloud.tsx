import { useMemo, useRef, useState, useLayoutEffect, useCallback } from 'react';

interface GenreCloudProps {
  genres: [string, number][];
  selectedGenre: string | null;
  onSelect: (genre: string | null) => void;
}

// ── Hardcoded config ──
const FONT_FAMILY = '"Impact","Arial Black","Helvetica Neue","Helvetica","Arial",system-ui,sans-serif';
const MIN_FONT_PX = 10;
const MAX_FONT_PX = 180;
const CAP_HEIGHT_RATIO = 0.7;
const POWER_EXP = 0.7;
const SPACE_POWER = 0.8;
const MIN_SPACE = 0.015;
const OVERSHOOT_X = 1.03;

let _canvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, fontSize: number): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.55;
  if (!_canvas) _canvas = document.createElement('canvas');
  const ctx = _canvas.getContext('2d')!;
  ctx.font = `900 ${fontSize}px ${FONT_FAMILY}`;
  return ctx.measureText(text).width;
}

function splitIntoLines(name: string): string[] {
  const upper = name.toUpperCase();
  const words = upper.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [upper];

  if (words.length === 2) return [words[0], words[1]];
  if (words.length === 3) {
    const a: [string, string] = [words[0] + ' ' + words[1], words[2]];
    const b: [string, string] = [words[0], words[1] + ' ' + words[2]];
    return Math.abs(a[0].length - a[1].length) <= Math.abs(b[0].length - b[1].length) ? a : b;
  }

  const totalChars = words.reduce((s, w) => s + w.length, 0);
  let acc = 0;
  let splitIdx = 0;
  for (let i = 0; i < words.length; i++) {
    const before = acc;
    acc += words[i].length;
    if (acc >= totalChars / 2) {
      splitIdx = Math.abs(before - totalChars / 2) < Math.abs(acc - totalChars / 2) && i > 0 ? i - 1 : i;
      break;
    }
  }
  if (splitIdx >= words.length - 1) splitIdx = words.length - 2;
  if (splitIdx < 0) splitIdx = 0;
  return [words.slice(0, splitIdx + 1).join(' '), words.slice(splitIdx + 1).join(' ')];
}

// ── Tag packing ──
interface PlacedTag {
  key: string;
  raw: string;
  lines: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  lineScaleX: number[];
  capScaleY: number;
  fontSize: number;
  intensity: number;
  isBiggest: boolean;
}

function packTags(genres: [string, number][], cw: number): { tags: PlacedTag[]; totalHeight: number } {
  if (genres.length === 0 || cw <= 0) return { tags: [], totalHeight: 0 };

  const maxCount = Math.max(...genres.map(([, c]) => c));

  interface Pre {
    key: string;
    raw: string;
    lines: string[];
    fontSize: number;
    rawLW: number[];
    rawCapH: number;
    naturalMaxW: number;
    naturalTotalH: number;
    spaceWeight: number;
    intensity: number;
    isBiggest: boolean;
  }

  const pre: Pre[] = genres.map(([name, count], idx) => {
    const rawRatio = count / maxCount;
    const intensity = Math.pow(rawRatio, POWER_EXP);
    const fontSize = MIN_FONT_PX + intensity * (MAX_FONT_PX - MIN_FONT_PX);
    const lines = splitIntoLines(name);
    const rlw = lines.map(l => measureTextWidth(l, fontSize));
    const capH = fontSize * CAP_HEIGHT_RATIO;
    const totalH = lines.length * capH;
    const spaceWeight = Math.max(MIN_SPACE, Math.pow(rawRatio, SPACE_POWER));
    return {
      key: name + '-' + idx,
      raw: name,
      lines,
      fontSize,
      rawLW: rlw,
      rawCapH: capH,
      naturalMaxW: Math.max(...rlw),
      naturalTotalH: totalH,
      spaceWeight,
      intensity,
      isBiggest: idx === 0,
    };
  });

  const sorted = [...pre].sort((a, b) => b.spaceWeight - a.spaceWeight);

  // Greedy row packing by spaceWeight
  const rows: Pre[][] = [];
  let cur: Pre[] = [];

  for (const tag of sorted) {
    if (cur.length === 0) { cur.push(tag); continue; }
    const trial = [...cur, tag];
    const sumW = trial.reduce((s, t) => s + t.spaceWeight, 0);
    const trialH = cw / sumW;
    const minH = Math.max(...trial.map(t => t.naturalTotalH * 0.35));
    if (trialH < minH) { rows.push(cur); cur = [tag]; }
    else { cur.push(tag); }
  }
  if (cur.length > 0) rows.push(cur);

  const placed: PlacedTag[] = [];
  let yCursor = 0;

  for (const row of rows) {
    const sumW = row.reduce((s, t) => s + t.spaceWeight, 0);
    const minTotalH = Math.max(...row.map(t => t.naturalTotalH));
    const rowH = Math.max(cw / sumW, minTotalH);
    let xCursor = 0;

    for (const tag of row) {
      const tagW = (tag.spaceWeight / sumW) * cw;
      const fontScale = Math.min(rowH / tag.naturalTotalH, 1.5);
      const scaledLW = tag.rawLW.map(lw => lw * fontScale);
      const scaledCapH = tag.rawCapH * fontScale;

      const lineScaleX = scaledLW.map(lw => (tagW * OVERSHOOT_X) / Math.max(lw, 0.0001));
      const nLines = tag.lines.length;
      const stripH = rowH / nLines;
      const capScaleY = stripH / Math.max(scaledCapH, 0.0001);

      placed.push({
        key: tag.key,
        raw: tag.raw,
        lines: tag.lines,
        x: xCursor,
        y: yCursor,
        w: tagW,
        h: rowH,
        lineScaleX,
        capScaleY,
        fontSize: tag.fontSize * fontScale,
        intensity: tag.intensity,
        isBiggest: tag.isBiggest,
      });

      xCursor += tagW;
    }

    yCursor += rowH;
  }

  return { tags: placed, totalHeight: yCursor };
}

// ── Component ──
export function GenreCloud({ genres, selectedGenre, onSelect }: GenreCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => { const w = el.clientWidth; if (w > 0) setWidth(w); };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { tags, totalHeight } = useMemo(() => packTags(genres, width), [genres, width]);

  const handleClick = useCallback((raw: string) => {
    onSelect(selectedGenre === raw ? null : raw);
  }, [selectedGenre, onSelect]);

  const anySelected = selectedGenre !== null;

  return (
    <div className="genre-cloud wall" style={{ position: 'relative', width: '100%', background: 'var(--bg)' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: totalHeight > 0 ? `${totalHeight}px` : 0,
          overflow: 'hidden',
          fontFamily: FONT_FAMILY,
          background: 'var(--bg)',
        }}
      >
        {tags.map(t => {
          const isSelected = selectedGenre === t.raw;
          const dim = anySelected && !isSelected;

          let color: string;
          if (isSelected) color = '#ff1a1a';
          else if (t.isBiggest) color = '#ffffff';
          else {
            const l = 38 + t.intensity * 58;
            color = `hsl(0, 0%, ${Math.min(l, 94)}%)`;
          }

          const nLines = t.lines.length;
          const stripH = t.h / nLines;

          return (
            <div
              key={t.key}
              onClick={() => handleClick(t.raw)}
              onMouseEnter={() => setHovered(t.raw)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate3d(${t.x}px, ${t.y}px, 0)`,
                width: `${t.w}px`,
                height: `${t.h}px`,
                margin: 0,
                padding: 0,
                color,
                cursor: 'pointer',
                overflow: 'hidden',
                opacity: dim ? 0.15 : hovered === t.raw && !isSelected ? 0.9 : 1,
                transition: 'opacity 0.08s linear, color 0.08s linear',
                textShadow: isSelected
                  ? '0 0 24px rgba(255,0,0,0.95), 0 0 8px rgba(255,40,40,1), 0 0 2px rgba(255,80,80,1)'
                  : t.isBiggest
                    ? '0 0 14px rgba(255,255,255,0.45)'
                    : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {t.lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: `${stripH}px`,
                    overflow: 'hidden',
                    lineHeight: 1,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      margin: 0,
                      padding: 0,
                      fontSize: `${t.fontSize}px`,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      transform: `translate(-50%, -50%) scale(${t.lineScaleX[i]}, ${t.capScaleY})`,
                      transformOrigin: 'center center',
                      willChange: 'transform',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
