import { similarity } from './similarity';
import type { MatchResult } from '../types';

export function parseFilename(f: string): { num: string; name: string } {
  // f can be full path or just filename — extract basename
  const basename = f.split(/[\\/]/).pop() || f;
  const base = basename.replace(/\.mp3$/i, '');
  const m = base.match(/^(\d{1,3})[.\s_-]+(.+)/);
  if (m) {
    const rest = m[2].trim();
    const dashIdx = rest.indexOf(' - ');
    if (dashIdx > 0) return { num: m[1]!, name: rest.slice(dashIdx + 3) };
    return { num: m[1]!, name: rest };
  }
  // Fallback: filename is just a number
  const justNum = base.match(/^(\d+)$/);
  if (justNum) return { num: justNum[1]!, name: '' };
  const dashIdx = base.indexOf(' - ');
  if (dashIdx > 0) {
    return { num: '', name: base.slice(dashIdx + 3) };
  }
  return { num: '', name: base };
}

export function matchTracks(
  remote: { num: string; artist: string; name: string; duration?: number }[],
  localFiles: string[],
  trackTitles?: Record<string, string>,
  matchByFilename = false,
  filenameMode: 'id3' | 'filename' = 'id3',
): MatchResult[] {
  const localParsed = localFiles.map(f => {
    const parsed = parseFilename(f);
    const id3Title = trackTitles?.[f];
    const nameToUse = filenameMode === 'filename' ? parsed.name : id3Title || parsed.name;
    return { ...parsed, name: nameToUse, fileName: parsed.name, file: f };
  });
  const usedLocal = new Set<number>();

  const results: MatchResult[] = remote.map(rt => {
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < localParsed.length; i++) {
      if (usedLocal.has(i)) continue;
      const comparisonName = matchByFilename ? localParsed[i].fileName : localParsed[i].name;
      const s = similarity(rt.name, comparisonName);
      if (s > bestSim) { bestSim = s; bestIdx = i; }
    }
    if (bestIdx >= 0 && bestSim >= 50) {
      usedLocal.add(bestIdx);
      return { remote: { num: rt.num, artist: rt.artist, name: rt.name, duration: rt.duration }, local: localParsed[bestIdx]!, sim: bestSim };
    }
    return { remote: { num: rt.num, artist: rt.artist, name: rt.name, duration: rt.duration }, local: null, sim: 0 };
  });

  for (const r of results) {
    if (r.local) continue;
    // Compare as numbers to handle leading zero differences (e.g. '1' vs '01')
    const byNum = localParsed.findIndex((l, i) => parseInt(l.num || '0', 10) === parseInt(r.remote.num, 10) && !usedLocal.has(i));
    if (byNum >= 0) {
      usedLocal.add(byNum);
      r.local = localParsed[byNum];
      const comparisonName = matchByFilename ? localParsed[byNum]!.fileName : localParsed[byNum]!.name;
      r.sim = similarity(r.remote.name, comparisonName);
    }
  }

  return results;
}
