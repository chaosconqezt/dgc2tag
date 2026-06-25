import type { SearchSource } from './types.js';
import { searchBandcamp, getBandcampAlbum } from '../bandcamp.js';

export const bandcampSource: SearchSource = {
  id: 'bandcamp',
  label: 'Bandcamp',
  accentColor: '#629aa9',

  async search(artist, album, query) {
    return searchBandcamp(artist || '', album || '', query);
  },

  async getDetails(id) {
    return getBandcampAlbum(id);
  },
};
