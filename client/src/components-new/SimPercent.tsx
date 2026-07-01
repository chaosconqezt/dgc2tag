import type { CSSProperties } from 'react';

function simColor(pct: number): string {
  if (pct >= 100) return 'var(--green)';
  if (pct <= 50) return 'var(--red)';
  const t = (pct - 50) / 50;
  const h = Math.round(t * 60);
  const s = Math.round(85 + t * 15);
  const l = Math.round(45 + t * 5);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function SimPercent({ value, style }: { value: number; style?: CSSProperties }) {
  return (
    <span style={{ color: simColor(value), fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)', fontWeight: 700, ...style }}>
      {value}%
    </span>
  );
}
