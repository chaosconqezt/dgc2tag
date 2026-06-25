import type { SearchSource } from './types.js';
import { dgcSource } from './dgc.js';
import { deezerSource } from './deezer.js';
import { musicbrainzSource } from './musicbrainz.js';
import { bandcampSource } from './bandcamp.js';

export const sources: SearchSource[] = [dgcSource, deezerSource, musicbrainzSource, bandcampSource];

export function getSource(id: string): SearchSource | undefined {
  return sources.find(s => s.id === id);
}
