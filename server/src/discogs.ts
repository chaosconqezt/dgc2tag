import axios from 'axios';
import { logger } from './logger.js';

const DISCOGS_BASE = 'https://api.discogs.com';

function getToken(): string {
    const token = process.env.DISCOGS_TOKEN;
    if (!token) {
        throw new Error('DISCOGS_TOKEN not set in environment');
    }
    return token;
}

export interface DiscogsSearchResult {
    source: 'discogs';
    id: string;
    masterId: string | null;
    albumName: string;
    artist: string;
    year: string | null;
    label: string | null;
    genres: string[];
    styles: string[];
    releaseType: string | null;
    format: string | null;
    country: string | null;
    coverUrl: string;
    trackCount: number;
    url: string;
    compilation?: boolean;
    parsedTracks?: { num: string; artist: string; name: string; duration: number | undefined }[];
}

interface DgSearchResult {
    id: number;
    master_id?: number;
    title: string;
    year?: string;
    genre?: string[];
    style?: string[];
    label?: string[];
    format?: string[];
    country?: string;
    cover_image?: string;
    thumb?: string;
    uri?: string;
    type?: string;
}

interface DgTrack {
    position: string;
    title: string;
    duration?: string;
    type_?: string;
    artists?: { name: string }[];
}

interface DgRelease {
    id: number;
    master_id?: number;
    title: string;
    artists?: { name: string; anv?: string; id?: number }[];
    year?: number;
    genres?: string[];
    styles?: string[];
    labels?: { name: string }[];
    formats?: { name: string; qty?: string; descriptions?: string[] }[];
    country?: string;
    thumb?: string;
    uri?: string;
    tracklist?: DgTrack[];
    images?: { uri?: string; uri150?: string; type?: string }[];
    notes?: string;
    videos?: { uri: string; title: string }[];
}

interface DgMaster {
    id: number;
    main_release: number;
    artists?: { name: string; anv?: string; id?: number }[];
    title: string;
    genres?: string[];
    styles?: string[];
    tracklist?: DgTrack[];
    images?: { uri?: string; uri150?: string; type?: string }[];
    year?: number;
}

function parseTrackDuration(duration: string): number | undefined {
    if (!duration) return undefined;
    const parts = duration.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]!, 10) * 60 + parseInt(parts[1]!, 10);
    }
    return undefined;
}

function extractFormat(dgFormats?: { name: string; qty?: string; descriptions?: string[] }[]): string | null {
    if (!dgFormats?.length) return null;
    const f = dgFormats[0]!;
    return [f.name, f.descriptions?.join(', ')].filter(Boolean).join(' - ') || null;
}

function joinFormatArray(arr?: string[]): string | null {
    if (!arr?.length) return null;
    return arr.join(', ');
}

function parseSearchTitle(title: string): { artist: string; albumName: string } {
    const idx = title.indexOf(' - ');
    if (idx > 0) {
        return {
            artist: title.substring(0, idx).trim(),
            albumName: title.substring(idx + 3).trim(),
        };
    }
    return { artist: '', albumName: title };
}

function buildUrl(uri?: string): string {
    return uri ? `https://www.discogs.com${uri}` : '';
}

function filterTracks(tracklist?: DgTrack[]): DgTrack[] {
    if (!tracklist) return [];
    return tracklist.filter(t => t.type_ !== 'heading');
}

function mapResult(r: DgSearchResult): DiscogsSearchResult {
    const { artist: parsedArtist, albumName } = parseSearchTitle(r.title);
    const fmt = joinFormatArray(r.format);
    return {
        source: 'discogs',
        id: String(r.id),
        masterId: r.master_id != null && r.master_id > 0 ? String(r.master_id) : null,
        albumName,
        artist: parsedArtist,
        year: r.year || null,
        label: r.label?.[0] || null,
        genres: r.genre || [],
        styles: r.style || [],
        releaseType: fmt,
        format: fmt,
        country: r.country || null,
        coverUrl: r.cover_image || r.thumb || '',
        trackCount: 0,
        url: buildUrl(r.uri),
    };
}

export async function searchDiscogs(artist?: string, album?: string): Promise<DiscogsSearchResult[]> {
    const parts = [artist, album].filter(Boolean);
    const query = parts.join(' ');
    if (!query) return [];

    logger.info(`discogs search: "${query}"`);

    const token = getToken();
    const headers = { 'Authorization': `Discogs token=${token}` };

    // Search both masters and releases to cover all cases
    const [masterRes, releaseRes] = await Promise.all([
        axios.get(`${DISCOGS_BASE}/database/search`, { headers, params: { q: query, type: 'master', per_page: 5 } }),
        axios.get(`${DISCOGS_BASE}/database/search`, { headers, params: { q: query, type: 'release', per_page: 5 } }),
    ]);

    const masterResults = (masterRes.data?.results || []) as DgSearchResult[];
    const releaseResults = (releaseRes.data?.results || []) as DgSearchResult[];

    if (!masterResults.length && !releaseResults.length) {
        logger.info('discogs: 0 results');
        return [];
    }

    // Deduplicate: track master_ids to avoid showing releases that belong to a master
    const seenMasterId = new Set<number>();
    const results: DiscogsSearchResult[] = [];

    // Masters first (canonical genres/styles)
    for (const r of masterResults) {
        seenMasterId.add(r.id);
        results.push(mapResult(r));
    }

    // Releases not already covered by a master
    for (const r of releaseResults) {
        const mid = r.master_id && r.master_id > 0 ? r.master_id : r.id;
        if (seenMasterId.has(mid)) continue;
        if (r.master_id && r.master_id > 0) seenMasterId.add(r.master_id);
        results.push(mapResult(r));
    }

    logger.info(`discogs: ${results.length} results (${masterResults.length} masters, ${releaseResults.length} releases)`);
    return results;
}

export async function getDiscogsRelease(id: string): Promise<DiscogsSearchResult> {
    logger.info(`discogs detail: ${id}`);
    const token = getToken();

    // Try master first — that's what search returns
    let master: DgMaster;
    try {
        const { data: m } = await axios.get<DgMaster>(`${DISCOGS_BASE}/masters/${id}`, {
            headers: { 'Authorization': `Discogs token=${token}` },
        });
        master = m;
    } catch {
        // Fallback: treat as release ID
        logger.info(`discogs: ${id} is not a master, fetching as release`);
        const { data: rel } = await axios.get<DgRelease>(`${DISCOGS_BASE}/releases/${id}`, {
            headers: { 'Authorization': `Discogs token=${token}` },
        });

        const relTracks = filterTracks(rel.tracklist);
        const result: DiscogsSearchResult = {
            source: 'discogs',
            id: String(rel.id),
            masterId: rel.master_id != null ? String(rel.master_id) : null,
            albumName: rel.title,
            artist: rel.artists?.map(a => a.name).join(', ') || '',
            year: rel.year != null ? String(rel.year) : null,
            label: rel.labels?.[0]?.name || null,
            genres: rel.genres || [],
            styles: rel.styles || [],
            releaseType: extractFormat(rel.formats),
            format: extractFormat(rel.formats),
            country: rel.country || null,
            coverUrl: rel.images?.find(i => i.type === 'primary')?.uri || rel.images?.[0]?.uri || rel.thumb || '',
            trackCount: relTracks.length,
            url: buildUrl(rel.uri),
        };

        if (relTracks.length) {
            result.parsedTracks = relTracks.map(t => ({
                num: t.position,
                artist: t.artists?.map(a => a.name).join(', ') || result.artist,
                name: t.title,
                duration: parseTrackDuration(t.duration || ''),
            }));
        }

        return result;
    }

    // Master found — fetch main release for tracklist (has per-track artists), label, country, format
    let releaseTracks: DgTrack[] | undefined;
    let label: string | null = null;
    let country: string | null = null;
    let formats: { name: string; qty?: string; descriptions?: string[] }[] | undefined;

    try {
        const { data: rel } = await axios.get<DgRelease>(`${DISCOGS_BASE}/releases/${master.main_release}`, {
            headers: { 'Authorization': `Discogs token=${token}` },
        });
        releaseTracks = rel.tracklist;
        label = rel.labels?.[0]?.name || null;
        country = rel.country || null;
        formats = rel.formats;
    } catch {
        logger.warn(`discogs: failed to fetch main_release ${master.main_release}`);
    }

    const artist = master.artists?.map(a => a.name).join(', ') || '';
    const year = master.year != null ? String(master.year) : null;
    const coverUrl = master.images?.find(i => i.type === 'primary')?.uri || master.images?.[0]?.uri || '';

    const tracks = filterTracks(releaseTracks || master.tracklist);
    const parsedTracks = tracks.map(t => {
        const trackArtist = t.artists?.map(a => a.name).join(', ') || artist;
        return {
            num: t.position,
            artist: trackArtist,
            name: t.title,
            duration: parseTrackDuration(t.duration || ''),
        };
    });

    const uniqueArtists = new Set(parsedTracks.map(t => t.artist).filter(Boolean));
    const compilation = uniqueArtists.size > 1;

    const result: DiscogsSearchResult = {
        source: 'discogs',
        id: String(master.id),
        masterId: String(master.id),
        albumName: master.title,
        artist,
        year,
        label,
        genres: master.genres || [],
        styles: master.styles || [],
        releaseType: extractFormat(formats),
        format: extractFormat(formats),
        country,
        coverUrl,
        trackCount: tracks.length,
        url: buildUrl(`/master/${master.id}`),
        ...(compilation ? { compilation: true } : {}),
    };

    if (parsedTracks.length) {
        result.parsedTracks = parsedTracks;
    }

    return result;
}
