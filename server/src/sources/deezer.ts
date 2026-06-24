import type { SearchSource } from './types.js';
import { searchDeezer } from '../deezer.js';

export const deezerSource: SearchSource = {
  id: 'deezer',
  label: 'Deezer',
  accentColor: '#4ade80',

  async search(artist, album) {
    // Pass through original DeezerSearchResult type
    return searchDeezer(artist, album) as any;
  },
};
