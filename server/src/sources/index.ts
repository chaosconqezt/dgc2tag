import type { SearchSource } from './types.js';
import { dgcSource } from './dgc.js';
import { deezerSource } from './deezer.js';
import { musicbrainzSource } from './musicbrainz.js';
import { discogsSource } from './discogs.js';

export const sources: SearchSource[] = [dgcSource, deezerSource, musicbrainzSource, discogsSource];

export function getSource(id: string): SearchSource | undefined {
  return sources.find(s => s.id === id);
}
