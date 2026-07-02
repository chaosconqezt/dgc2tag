import { useMemo, useState } from "react";

interface GenreBarChartProps {
  genres: [string, number][];
  selectedGenre: string | null;
  onSelect: (genre: string | null) => void;
}

const BAR_MAX_H = 200;
const GAP = 4;
const TEXT_AREA_H = 70;

export function GenreBarChart({
  genres,
  selectedGenre,
  onSelect,
}: GenreBarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const anySelected = selectedGenre !== null;

  const sorted = useMemo(
    () =>
      [...genres].sort((a, b) =>
        a[0].toLowerCase().localeCompare(b[0].toLowerCase())
      ),
    [genres]
  );

  const maxCount = sorted.reduce((m, [, c]) => Math.max(m, c), 0);

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid #1a1a1a",
        borderRadius: "0px",
        padding: "24px 24px 0",
        width: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Верхняя часть: столбцы */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: `${GAP}px`,
          height: `${BAR_MAX_H + 16}px`,
          width: "100%",
        }}
      >
        {sorted.map(([name, count]) => {
          const isSelected = selectedGenre === name;
          const isDimmed = anySelected && !isSelected;
          const pct = maxCount > 0 ? count / maxCount : 0;
          const barH = Math.max(2, pct * BAR_MAX_H);

          const barOpacity = isSelected
            ? 1
            : isDimmed
              ? hovered === name
                ? 0.35
                : 0.08
              : hovered === name
                ? 1
                : 0.5;

          return (
            <div
              key={name}
              onClick={() => onSelect(selectedGenre === name ? null : name)}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                alignSelf: "flex-end",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                opacity: barOpacity,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Число над столбцом */}
              <span
                style={{
                  fontSize: "8px",
                  color: isSelected ? "#d0d0d0" : "#555",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  marginBottom: "3px",
                  lineHeight: 1,
                }}
              >
                {count}
              </span>

              {/* Столбец */}
              <div
                style={{
                  width: "100%",
                  height: `${barH}px`,
                  background: isSelected ? "#e0e0e0" : "#3a3a3a",
                  borderRadius: "0px",
                  transition: "background 0.2s ease",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Разделительная линия */}
      <div
        style={{
          width: "100%",
          height: "1px",
          background: "#2a2a2a",
          marginTop: "0px",
        }}
      />

      {/* Нижняя часть: названия */}
      <div
        style={{
          display: "flex",
          gap: `${GAP}px`,
          height: `${TEXT_AREA_H}px`,
          width: "100%",
        }}
      >
        {sorted.map(([name]) => {
          const isSelected = selectedGenre === name;
          const isDimmed = anySelected && !isSelected;
          const textOpacity = isSelected ? 1 : isDimmed ? 0.15 : 0.45;

          return (
            <div
              key={name}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: textOpacity,
                transition: "opacity 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: isSelected ? "#d0d0d0" : "#555",
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}