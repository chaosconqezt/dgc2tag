import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

// Type for NodeID3.read() result — matches the actual runtime shape
interface Id3Tags {
    artist?: string;
    album?: string;
    albumArtist?: string;
    genre?: string;
    year?: string;
    track?: number;
    title?: string;
    length?: number | string;
    bitrate?: number;
    audioFormat?: string;
    notes?: string;
    publisher?: string; // TIT3/PUB
    performerInfo?: string; // TPE2
    userDefinedText?: { key: string; value: string; description?: string }[];
    recordingTime?: string;
    [key: string]: unknown;
}

export interface AlbumTags {
    artist?: string;
    albumArtist?: string;
    album?: string;
    year?: string;
    genre?: string;
    country?: string;
    label?: string;
    releaseType?: string;
    trackCount?: number;
    // ALL keys are FULL FILE PATHS — immutable identifiers
    files?: string[];
    trackTitles?: Record<string, string>;  // filePath → title
    trackArtists?: Record<string, string>; // filePath → artist
    trackDurations?: Record<string, number>; // filePath → duration
    postId?: number | null;
    deezerId?: number | null;
    artists?: string[];
    albumArtists?: string[];
}

function readTags(filePath: string): Id3Tags {
    return NodeID3.read(filePath) as unknown as Id3Tags;
}

function extractTrackNum(tags: Id3Tags): string {
    let trackNum = '00';
    if (tags.track) {
        const t = String(tags.track);
        const slashIdx = t.indexOf('/');
        const numStr = slashIdx > 0 ? t.slice(0, slashIdx) : t;
        const m = numStr.match(/^(\d+)/);
        if (m?.[1]) trackNum = m[1];
    }
    if ((trackNum === '00' || !trackNum) && tags.trackNumber) {
        const tn = String(tags.trackNumber);
        const slashIdx = tn.indexOf('/');
        const extracted = slashIdx > 0 ? tn.slice(0, slashIdx) : tn;
        if (/^\d+$/.test(extracted)) trackNum = extracted;
    }
    return trackNum;
}

export async function getTags(folderPath: string): Promise<AlbumTags> {
    const files = await fs.readdir(folderPath);
    const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));

    if (mp3Files.length === 0) {
        throw new Error('No MP3 files found in this folder');
    }

    // Read ALL tracks ONCE — key by FULL PATH (immutable identifier)
    const filePaths: string[] = [];
    const trackTitles: Record<string, string> = {};
    const trackArtistsMap: Record<string, string> = {};
    const trackDurations: Record<string, number> = {};
    const trackNums: Record<string, string> = {}; // filePath → trackNum
    const trackArtistsSet = new Set<string>();
    const albumArtistsSet = new Set<string>();

    for (const file of mp3Files) {
        const filePath = path.join(folderPath, file);
        const tags = readTags(filePath);

        let trackNum = extractTrackNum(tags);
        if (!trackNum) {
            const numMatch = file.match(/^(\d{1,3})/);
            trackNum = numMatch?.[1] || '';
        }

        filePaths.push(filePath);
        trackNums[filePath] = trackNum;
        if (tags.title) trackTitles[filePath] = tags.title as string;
        if (tags.artist) {
            trackArtistsMap[filePath] = tags.artist as string;
            trackArtistsSet.add(tags.artist as string);
        }
        if (tags.performerInfo) albumArtistsSet.add(tags.performerInfo as string);
        if (tags.length) trackDurations[filePath] = Math.round(Number(tags.length) / 1000);
    }

    if (Object.keys(trackDurations).length === 0) {
        logger.warn(`no trackDurations found for ${folderPath} — MP3 files may lack TLEN frame`);
    }

    // Album-level info from first file
    const firstTags = readTags(filePaths[0]!);
    const rawYear = firstTags.year || firstTags.recordingTime || null;
    const year = rawYear && /^\d{4}$/.test(rawYear) ? rawYear : null;

    const countryFrame = firstTags.userDefinedText?.find(
        (t: { description?: string; value?: string }) => t.description?.toLowerCase() === 'country'
    );
    const releaseTypeFrame = firstTags.userDefinedText?.find(
        (t: { description?: string; value?: string }) =>
            t.description?.toLowerCase() === 'releasetype' ||
            t.description?.toLowerCase() === 'musicbrainz album type'
    );
    const postIdFrame = firstTags.userDefinedText?.find(
        (t: { description?: string; value?: string }) => t.description?.toLowerCase() === 'dgc_post_id'
    );
    const deezerIdFrame = firstTags.userDefinedText?.find(
        (t: { description?: string; value?: string }) => t.description?.toLowerCase() === 'deezer_id'
    );

    const artist = (firstTags.artist as string | undefined) || (firstTags.performerInfo as string | undefined);
    const albumArtist = (firstTags.performerInfo as string | undefined) || (firstTags.artist as string | undefined);

    const result: AlbumTags = {};
    if (artist !== undefined) result.artist = artist;
    if (albumArtist !== undefined) result.albumArtist = albumArtist;
    if ((firstTags.album as string | undefined) !== undefined) result.album = firstTags.album as string;
    if (year !== undefined && year !== null) result.year = year;
    const g = firstTags.genre as string | null | undefined;
    if (g !== undefined && g !== null) result.genre = g;
    const cf = countryFrame?.value;
    if (cf !== undefined) result.country = cf;
    const pub = firstTags.publisher;
    if (pub !== undefined) result.label = pub;
    const rt = releaseTypeFrame?.value;
    if (rt !== undefined) result.releaseType = rt;
    result.trackCount = filePaths.length;
    result.files = filePaths;
    result.trackTitles = trackTitles;
    result.trackArtists = trackArtistsMap;
    result.trackDurations = trackDurations;
    if (postIdFrame) result.postId = Number(postIdFrame.value) || null;
    if (deezerIdFrame) result.deezerId = Number(deezerIdFrame.value) || null;
    result.artists = [...trackArtistsSet];
    result.albumArtists = [...albumArtistsSet];
    return result;
}
