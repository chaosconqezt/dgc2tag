import type { SearchSource } from './types.js';
import { searchAlbums, getAlbumDetails } from '../scraper.js';

export const dgcSource: SearchSource = {
  id: 'dgc',
  label: 'DGC',
  accentColor: '#ef4444',

  async search(_artist, _album, query) {
    return searchAlbums(query || '');
  },

  async getDetails(id) {
    return getAlbumDetails(Number(id));
  },
};
