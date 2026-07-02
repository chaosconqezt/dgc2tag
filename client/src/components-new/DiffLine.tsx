import { useMemo } from 'react';
import type { DiffEntry } from '../hooks/appReducer';

function editDist(a: string, b: string): number {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i]![0] = i;
  for (let j = 1; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! : 1 + Math.min(dp[i - 1]![j - 1]!, dp[i - 1]![j]!, dp[i]![j - 1]!);
  return dp[n]![m]!;
}

function charWord(a: string, b: string): { text: string; diff: boolean }[] {
  const n = a.length, m = b.length;
  if (!n || !m || a === b) return [{ text: a, diff: false }];
  if (n === m) {
    const groups: { text: string; diff: boolean }[] = [];
    let cur = { text: a[0]!, diff: a[0] !== b[0] };
    for (let i = 1; i < n; i++) {
      const d = a[i] !== b[i];
      if (d === cur.diff) cur.text += a[i];
      else { groups.push(cur); cur = { text: a[i]!, diff: d }; }
    }
    groups.push(cur);
    return groups;
  }
  let pos = 0;
  while (pos < n && pos < m && a[pos] === b[pos]) pos++;
  if (n > m) {
    if (!pos) return [{ text: a, diff: true }];
    return [
      { text: a.slice(0, pos), diff: false },
      { text: a[pos]!, diff: true },
      ...(pos < n - 1 ? [{ text: a.slice(pos + 1), diff: false }] : []),
    ];
  }
  if (!pos) return [{ text: a, diff: false }];
  return [{ text: a.slice(0, pos), diff: false }, { text: a.slice(pos), diff: false }].filter(s => s.text);
}

export function computeWordSegments(a: string, b: string): { text: string; diff: boolean }[] {
  const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
  const aWords = a.split(/\s+/);
  const bNorms = b.split(/\s+/).map(norm);
  const result: { text: string; diff: boolean }[] = [];

  for (const [i, w] of aWords.entries()) {
    const prefix = i ? ' ' : '';
    const nw = norm(w);

    if (bNorms.includes(nw)) {
      result.push({ text: prefix + w, diff: false });
      continue;
    }

    let bestDist = Infinity;
    let bestMatch = '';
    for (const bn of bNorms) {
      const d = editDist(nw, bn);
      if (d < bestDist) { bestDist = d; bestMatch = bn; }
    }

    if (bestDist <= 1 && bestMatch) {
      const parts = charWord(w, bestMatch);
      if (prefix) result.push({ text: prefix, diff: false });
      result.push(...parts);
      continue;
    }

    result.push({ text: prefix + w, diff: true });
  }

  return result;
}

export function WordDiff({ a, b, className }: { a: string; b: string; className?: string }) {
  const segs = useMemo(() => computeWordSegments(a, b), [a, b]);
  return (
    <>
      {segs.map((s, i) =>
        s.diff ? <span key={i} className={className}>{s.text}</span> : s.text
      )}
    </>
  );
}

function VisualDiff({ from, to }: { from: string; to: string }) {
  const extMatch = from.match(/(\.[^.]+)$/);
  const commonExt = extMatch && to.endsWith(extMatch[1]) ? extMatch[1] : '';
  const baseFrom = commonExt ? from.slice(0, -commonExt.length) : from;
  const baseTo = commonExt ? to.slice(0, -commonExt.length) : to;

  const oldSegs = useMemo(() => {
    const segs = computeWordSegments(baseFrom, baseTo);
    if (commonExt) segs.push({ text: commonExt, diff: false });
    return segs;
  }, [baseFrom, baseTo, commonExt]);
  const newSegs = useMemo(() => {
    const segs = computeWordSegments(baseTo, baseFrom);
    if (commonExt) segs.push({ text: commonExt, diff: false });
    return segs;
  }, [baseTo, baseFrom, commonExt]);
  const gap = '   \u2192   ';

  const rows = useMemo(() => {
    const oldTxt = oldSegs.map(s => s.text).join('');
    const newTxt = newSegs.map(s => s.text).join('');
    const totalLen = oldTxt.length + gap.length + newTxt.length;

    const oldDiffs: number[] = [];
    let off = 0;
    for (const s of oldSegs) {
      if (s.diff) oldDiffs.push(Math.floor(off + s.text.length / 2));
      off += s.text.length;
    }
    const newDiffs: number[] = [];
    off = 0;
    for (const s of newSegs) {
      if (s.diff) newDiffs.push(oldTxt.length + gap.length + Math.floor(off + s.text.length / 2));
      off += s.text.length;
    }
    const allDiffs = [...oldDiffs, ...newDiffs].sort((a, b) => a - b);
    if (!allDiffs.length) return null;

    const first = allDiffs[0]!;
    const last = allDiffs[allDiffs.length - 1]!;

    const row2: string[] = Array(totalLen).fill(' ');
    const row3: string[] = Array(totalLen).fill(' ');

    for (const c of allDiffs) {
      if (c > 0) row2[c - 1] = '\u2500';
      row2[c] = '\u252C';
      if (c < totalLen - 1) row2[c + 1] = '\u2500';
    }

    for (let c = first; c <= last; c++) {
      if (allDiffs.includes(c)) {
        if (c === first) row3[c] = '\u2514';
        else if (c === last) row3[c] = '\u2518';
        else row3[c] = '\u2534';
      } else {
        row3[c] = '\u2500';
      }
    }

    return { row2: row2.join(''), row3: row3.join('') };
  }, [oldSegs, newSegs, gap]);

  return (
    <div className="vdiff-wrap">
      <div className="vdiff-row">
        <span className="vdiff-side">
          {oldSegs.map((s, i) =>
            s.diff ? <span key={i} className="vdiff-del">{s.text}</span> : s.text
          )}
        </span>
        <span className="vdiff-arrow">{gap}</span>
        <span className="vdiff-side">
          {newSegs.map((s, i) =>
            s.diff ? <span key={i} className="vdiff-ins">{s.text}</span> : s.text
          )}
        </span>
      </div>
      {rows && (
        <div className="vdiff-box">
          <div>{rows.row2}</div>
          <div>{rows.row3}</div>
        </div>
      )}
    </div>
  );
}

export function DiffBlock({ entries }: { entries: DiffEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="console" style={{ fontSize: 14, lineHeight: 1.5 }}>
      {entries.map((d, i) => (
        <div key={i} style={{ marginBottom: i < entries.length - 1 ? 14 : 0 }}>
          <VisualDiff from={d.from} to={d.to} />
        </div>
      ))}
    </div>
  );
}
