import type { SearchSource } from './types.js';
import { searchDiscogs, getDiscogsRelease } from '../discogs.js';

export const discogsSource: SearchSource = {
    id: 'discogs',
    label: 'Discogs',
    accentColor: '#a78bfa',

    async search(artist, album) {
        return searchDiscogs(artist, album) as any;
    },

    async getDetails(id) {
        return getDiscogsRelease(id) as any;
    },
};
