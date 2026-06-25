export { similarity } from './similarity';
export { parseFilename, matchTracks, parseCompilationTracklist } from './trackMatching';
import type { AlbumTags, SearchResult } from '../types';

export function stripParentheses(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

export function generateParsedTracks(
  albumDetails: SearchResult | null | undefined,
  localTags: AlbumTags | null | undefined,
): { num: string; artist: string; name: string }[] {
  if (albumDetails?.parsedTracks) return albumDetails.parsedTracks;
  const files = localTags?.files || [];
  return files.map((filePath, i) => {
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const numMatch = fileName.match(/^(\d{1,3})/);
    const num = numMatch?.[1] || String(i + 1).padStart(2, '0');
    const artist = localTags?.trackArtists?.[filePath] || localTags?.artist || '';
    const name = localTags?.trackTitles?.[filePath] || fileName.replace(/^\d+[\.\s)]*\s*/, '').replace(/\.mp3$/i, '');
    return { num, artist, name };
  });
}