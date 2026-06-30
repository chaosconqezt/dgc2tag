import { useMemo, useCallback } from 'react';

interface GenreCloudProps {
  genres: [string, number][];
  selectedGenre: string | null;
  onSelect: (genre: string | null) => void;
}

const MAX_TAGS = 45; 
const GRID_COLS = 48; 
const ROW_HEIGHT = 6; 

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function splitIntoLines(text: string): string[] {
  if (text.length <= 13) return [text]; 

  const words = text.split(' ');
  if (words.length <= 2) return words;

  const numLines = text.length > 22 ? 3 : 2;
  const targetLength = text.length / numLines;
  
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + (words[i].length / 2) > targetLength && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine += ' ' + words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

function getGrayscale(h: number): string {
  const lightness = 35 + (h % 35);
  return `hsl(0, 0%, ${lightness}%)`;
}

export function GenreCloud({ genres, selectedGenre, onSelect }: GenreCloudProps) {
  const items = useMemo(() => {
    const list = genres.slice(0, MAX_TAGS);
    if (list.length === 0) return [];
    
    list.sort((a, b) => b[1] - a[1]);
    const maxCount = list[0][1];

    let totalParrots = 0;

    const tags = list.map(([name, count], index) => {
      const weight = count / maxCount;
      const h = hash(name);
      const lines = splitIntoLines(name.toUpperCase());
      const maxLineLength = Math.max(...lines.map(l => l.length));

      const noise = 1 + ((h % 11) - 5) / 100;
      const naturalAR = ((maxLineLength * 0.6) / lines.length) * noise;

      // МАТАН 3.0: Компенсируем физические габариты сетки.
      // 1fr колонка обычно шире, чем 6px высота строки. Берем средний коэффициент 2.5
      const CELL_AR = 2.5; 
      const adjustedAR = naturalAR / CELL_AR;

      const parrots = 8 + Math.pow(weight, 3.5) * 250; 

      const targetH = Math.sqrt(parrots / adjustedAR);
      const targetW = targetH * adjustedAR;

      let colSpan = Math.max(1, Math.round(targetW));
      let rowSpan = Math.max(1, Math.round(targetH));
      
      const maxColSpan = Math.floor(GRID_COLS * 0.7);
      if (colSpan > maxColSpan) {
        colSpan = maxColSpan;
        rowSpan = Math.ceil(parrots / colSpan);
      }

      totalParrots += (colSpan * rowSpan);

      return {
        name: name.toUpperCase(),
        raw: name,
        lines,
        colSpan,
        rowSpan,
        weight,
        color: getGrayscale(h),
        isCenter: index === 0 
      };
    });

    const estimatedRows = Math.max(12, Math.ceil((totalParrots * 1.1) / GRID_COLS));
    const center = tags[0];
    
    const startCol = Math.max(1, Math.floor((GRID_COLS - center.colSpan) / 2) + 1);
    const startRow = Math.max(1, Math.floor((estimatedRows - center.rowSpan) / 2) + 1);

    tags.forEach(tag => {
      if (tag.isCenter) {
        tag.gridPosition = `${startRow} / ${startCol} / span ${tag.rowSpan} / span ${tag.colSpan}`;
      } else {
        tag.gridPosition = `span ${tag.rowSpan} / span ${tag.colSpan}`;
      }
    });

    return tags;
  }, [genres]);

  const handleSelect = useCallback((raw: string) => {
    onSelect(selectedGenre === raw ? null : raw);
  }, [selectedGenre, onSelect]);

  if (items.length === 0) return null;

  return (
    <div 
      className={`genre-cloud${selectedGenre ? ' dimmed' : ''}`} 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: `${ROW_HEIGHT}px`, 
        gridAutoFlow: 'row dense', 
        gap: '2px', 
        padding: '8px',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {items.map((tag) => {
        const isSelected = selectedGenre === tag.raw;
        const textColor = isSelected ? '#e5e5e5' : tag.color;
        const opacityLevel = selectedGenre && !isSelected ? 0.1 : 1;

        return (
          <div
            key={tag.name}
            onClick={() => handleSelect(tag.raw)}
            style={{
              gridArea: tag.gridPosition, 
              cursor: 'pointer',
              background: 'transparent', // Убрали заливку
              color: textColor,
              opacity: opacityLevel,
              transition: 'opacity 0.15s, color 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '2px',
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 1000 ${tag.lines.length * 200}`}
              preserveAspectRatio="none"
              style={{ display: 'block' }}
            >
              {tag.lines.map((line, lIdx) => (
                <text
                  key={lIdx}
                  x="0" 
                  y={lIdx * 200 + 175} 
                  textLength="1000" 
                  lengthAdjust="spacingAndGlyphs" 
                  fill="currentColor"
                  fontFamily="var(--font)" 
                  fontWeight={tag.weight > 0.1 ? 800 : 600} 
                  fontSize="215" 
                >
                  {line}
                </text>
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
}