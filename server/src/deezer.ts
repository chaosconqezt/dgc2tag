import axios from 'axios';
import { logger } from './logger.js';

const DEEZER_BASE = 'https://api.deezer.com';

export interface DeezerSearchResult {
    source: 'deezer';
    albumId: number;
    albumName: string;
    artist: string;
    year: string | null;
    label: string | null;
    releaseType: string | null;
    coverUrl: string;
    trackCount: number;
    tracks: { num: string; name: string; duration: number }[];
    url: string;
}

interface DzAlbumSearch {
    id: number;
    title: string;
    artist: { name: string };
    cover_xl: string;
    nb_tracks: number;
    record_type: string;
    link: string;
}

interface DzAlbumDetail {
    id: number;
    title: string;
    artist: { name: string };
    cover_xl: string;
    nb_tracks: number;
    release_date: string;
    label: string;
    record_type: string;
    link: string;
    tracks: {
        data: {
            track_position: number;
            title: string;
            duration: number;
        }[];
    };
}

export async function searchDeezer(artist?: string, album?: string): Promise<DeezerSearchResult[]> {
    const parts = [artist, album].filter(Boolean);
    const query = parts.join(' ');
    if (!query) return [];

    logger.info(`search: "${query}"`);

    const { data } = await axios.get(`${DEEZER_BASE}/search/album`, {
        params: { q: query, limit: 10 },
    });

    if (!data?.data?.length) {
        logger.info('0 results');
        return [];
    }

    const results: DeezerSearchResult[] = [];
    const seen = new Set<number>();

    for (const dzAlbum of data.data as DzAlbumSearch[]) {
        if (seen.has(dzAlbum.id)) continue;
        seen.add(dzAlbum.id);

        let detail: DzAlbumDetail;
        try {
            const { data: albumData } = await axios.get(`${DEEZER_BASE}/album/${dzAlbum.id}`);
            detail = albumData;
        } catch {
            logger.warn(`failed to fetch album ${dzAlbum.id}, using search data`);
            results.push({
                source: 'deezer',
                albumId: dzAlbum.id,
                albumName: dzAlbum.title,
                artist: dzAlbum.artist?.name || '',
                year: null,
                label: null,
                releaseType: dzAlbum.record_type || null,
                coverUrl: dzAlbum.cover_xl || '',
                trackCount: dzAlbum.nb_tracks,
                tracks: [],
                url: dzAlbum.link,
            });
            continue;
        }

        const year = detail.release_date?.substring(0, 4) || null;
        const tracks = (detail.tracks?.data || []).map(t => ({
            num: String(t.track_position),
            name: t.title,
            duration: t.duration,
        }));

        results.push({
            source: 'deezer',
            albumId: detail.id,
            albumName: detail.title,
            artist: detail.artist?.name || '',
            year,
            label: detail.label || null,
            releaseType: detail.record_type || null,
            coverUrl: detail.cover_xl || '',
            trackCount: detail.nb_tracks,
            tracks,
            url: detail.link,
        });
    }

    logger.info(`${results.length} results`);
    return results;
}
