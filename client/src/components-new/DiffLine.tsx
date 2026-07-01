import { useMemo } from 'react';
import type { DiffEntry } from '../hooks/appReducer';

function lcsMatrix(a: string, b: string): number[][] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]! + 1
        : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp;
}

interface Chunk {
  text: string;
  type: 'common' | 'del' | 'ins';
}

function computeChunks(a: string, b: string): Chunk[] {
  if (a === b) return [{ text: a, type: 'common' }];
  const dp = lcsMatrix(a, b);
  const stack: Chunk[] = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ text: a[i - 1]!, type: 'common' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      stack.push({ text: b[j - 1]!, type: 'ins' });
      j--;
    } else {
      stack.push({ text: a[i - 1]!, type: 'del' });
      i--;
    }
  }
  stack.reverse();
  const merged: Chunk[] = [];
  for (const c of stack) {
    const last = merged[merged.length - 1];
    if (last && last.type === c.type) last.text += c.text;
    else merged.push({ ...c });
  }
  return merged;
}

export function DiffHighlight({ oldStr, newStr, show }: { oldStr: string; newStr: string; show?: 'del' | 'ins' }) {
  const chunks = useMemo(() => computeChunks(oldStr, newStr), [oldStr, newStr]);
  return (
    <>
      {chunks.map((c, i) => {
        if (c.type === 'common') return c.text;
        if (show && c.type !== show) return <span key={i} className="diff-dim">{c.text}</span>;
        return <span key={i} className={c.type === 'del' ? 'diff-del' : 'diff-ins'}>{c.text}</span>;
      })}
    </>
  );
}

export function DiffBlock({ entries }: { entries: DiffEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="console">
      {entries.map((d, i) => (
        <span key={i} className="diff-entry">
          <span className="diff-line diff-old">
            <span className="diff-marker">-  </span>
            <DiffHighlight oldStr={d.from} newStr={d.to} show="del" />
          </span>
          <span className="diff-line diff-new">
            <span className="diff-marker">+  </span>
            <DiffHighlight oldStr={d.to} newStr={d.from} show="ins" />
          </span>
          {i < entries.length - 1 && <span className="console-sep" />}
        </span>
      ))}
    </div>
  );
}
