import type { SearchSource } from './types.js';
import { searchMusicBrainz, getMusicBrainzRelease } from '../musicbrainz.js';

export const musicbrainzSource: SearchSource = {
  id: 'mbrainz',
  label: 'MusicBrainz',
  accentColor: '#f97316',

  async search(artist, album) {
    return searchMusicBrainz(artist, album) as any;
  },

  async getDetails(id) {
    return getMusicBrainzRelease(id) as any;
  },
};
