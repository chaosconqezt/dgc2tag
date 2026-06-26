import axios from 'axios';
import { logger } from './logger.js';

const DEEZER_BASE = 'https://api.deezer.com';
const DEEZER_DELAY_MS = 120;

export interface DeezerSearchResult {
    source: 'deezer';
    id: string;
    albumId: number;
    albumName: string;
    artist: string;
    year: string | null;
    label: string | null;
    releaseType: string | null;
    compilation?: boolean;
    coverUrl: string;
    trackCount: number;
    tracks: { num: string; name: string; duration: number; artist?: string }[];
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
            artist?: { id: number; name: string };
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
                id: String(dzAlbum.id),
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
        const isCompilation = detail.record_type === 'compile';
        const tracks = (detail.tracks?.data || []).map(t => ({
            num: String(t.track_position ?? ''),
            name: t.title,
            duration: t.duration,
            ...(t.artist?.name ? { artist: t.artist.name } : {}),
        }));

        results.push({
            source: 'deezer',
            id: String(detail.id),
            albumId: detail.id,
            albumName: detail.title,
            artist: detail.artist?.name || '',
            year,
            label: detail.label || null,
            releaseType: detail.record_type || null,
            ...(isCompilation ? { compilation: true } : {}),
            coverUrl: detail.cover_xl || '',
            trackCount: detail.nb_tracks,
            tracks,
            url: detail.link,
        });

        await new Promise(r => setTimeout(r, DEEZER_DELAY_MS));
    }

    logger.info(`${results.length} results`);
    return results;
}
