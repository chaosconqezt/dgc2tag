import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import type { AlbumTags } from './types.js';

export type { AlbumTags } from './types.js';

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
    let year: string | null = null;
    if (rawYear) {
        // Try exact 4-digit year first
        if (/^\d{4}$/.test(rawYear)) {
            year = rawYear;
        } else {
            // Extract year from full date like "2024-03-15" or "20240315"
            const m = rawYear.match(/(\d{4})/);
            if (m?.[1]) year = m[1];
        }
    }

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

    // Collect extra userDefinedText tags from ALL tracks (track unique values)
    const knownFrames = ['country', 'releasetype', 'musicbrainz album type', 'dgc_post_id', 'deezer_id'];
    const extraTagsMap: Record<string, Set<string>> = {};

    for (const file of mp3Files) {
        const filePath = path.join(folderPath, file);
        const tags = readTags(filePath);

        if (tags.userDefinedText) {
            for (const frame of tags.userDefinedText) {
                const desc = frame.description?.toLowerCase() || '';
                if (desc && !knownFrames.includes(desc) && frame.value) {
                    const key = frame.description!;
                    if (!extraTagsMap[key]) extraTagsMap[key] = new Set();
                    extraTagsMap[key]!.add(frame.value);
                }
            }
        }
        if (tags.notes) {
            if (!extraTagsMap['Notes']) extraTagsMap['Notes'] = new Set();
            extraTagsMap['Notes'].add(tags.notes);
        }
        if (tags.bitrate) {
            if (!extraTagsMap['Bitrate']) extraTagsMap['Bitrate'] = new Set();
            extraTagsMap['Bitrate'].add(String(tags.bitrate));
        }
        if (tags.audioFormat) {
            if (!extraTagsMap['Format']) extraTagsMap['Format'] = new Set();
            extraTagsMap['Format'].add(tags.audioFormat);
        }
    }

    const extraTags: Record<string, string> = {};
    for (const [key, values] of Object.entries(extraTagsMap)) {
        const arr = [...values];
        if (arr.length === 1) {
            extraTags[key] = arr[0]!;
        } else {
            extraTags[key] = `${arr[0]} (+${arr.length - 1} more)`;
        }
    }

    result.trackCount = filePaths.length;
    result.files = filePaths;
    result.trackTitles = trackTitles;
    result.trackArtists = trackArtistsMap;
    result.trackDurations = trackDurations;
    if (postIdFrame) result.postId = Number(postIdFrame.value) || null;
    if (deezerIdFrame) result.deezerId = Number(deezerIdFrame.value) || null;
    result.artists = [...trackArtistsSet];
    result.albumArtists = [...albumArtistsSet];
    if (Object.keys(extraTags).length > 0) result.extraTags = extraTags;
    return result;
}
