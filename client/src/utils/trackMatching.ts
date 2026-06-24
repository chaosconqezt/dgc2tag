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

  // Pass 1: Match by track number (primary key — handles Part I/II/III correctly)
  const results: MatchResult[] = remote.map(rt => {
    const byNum = localParsed.findIndex(
      (l, i) => !usedLocal.has(i) && l.num && rt.num && parseInt(l.num, 10) === parseInt(rt.num, 10)
    );
    if (byNum >= 0) {
      usedLocal.add(byNum);
      const comparisonName = matchByFilename ? localParsed[byNum].fileName : localParsed[byNum].name;
      return { remote: { num: rt.num, artist: rt.artist, name: rt.name, duration: rt.duration }, local: localParsed[byNum], sim: similarity(rt.name, comparisonName) };
    }
    return { remote: { num: rt.num, artist: rt.artist, name: rt.name, duration: rt.duration }, local: null, sim: 0 };
  });

  // Pass 2: Match remaining by similarity (for tracks without numbers)
  for (const r of results) {
    if (r.local) continue;
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < localParsed.length; i++) {
      if (usedLocal.has(i)) continue;
      const comparisonName = matchByFilename ? localParsed[i].fileName : localParsed[i].name;
      const s = similarity(r.remote.name, comparisonName);
      if (s > bestSim) { bestSim = s; bestIdx = i; }
    }
    // Also check if remote name is a prefix/substring of local name (e.g. "Track" matches "Track (Cover)")
    if (bestIdx >= 0 && bestSim < 50) {
      const remoteLower = r.remote.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const localLower = (matchByFilename ? localParsed[bestIdx].fileName : localParsed[bestIdx].name).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (remoteLower && localLower.startsWith(remoteLower)) {
        bestSim = Math.max(bestSim, 80);
      }
    }
    if (bestIdx >= 0 && bestSim >= 50) {
      usedLocal.add(bestIdx);
      r.local = localParsed[bestIdx];
      r.sim = bestSim;
    }
  }

  return results;
}

export function parseCompilationTracklist(tracklist: string): { num: string; artist: string; name: string }[] {
  const lines = tracklist.split('\n');
  const tracks: { num: string; artist: string; name: string }[] = [];
  for (const line of lines) {
    const m = line.trim().match(/^(\d{1,3})[.\s)]+\s*(.+)/);
    if (!m) continue;
    const num = m[1]!;
    const rest = m[2]!.trim();
    const dashIdx = rest.search(/\s[-–—]\s/);
    if (dashIdx > 0) {
      tracks.push({ num, artist: rest.slice(0, dashIdx).trim(), name: rest.slice(dashIdx + 1).replace(/^[-–—]\s*/, '').trim() });
    } else {
      tracks.push({ num, artist: '', name: rest });
    }
  }
  return tracks;
}
