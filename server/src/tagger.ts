import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import type { AlbumTags, Id3Tags } from './types.js';
import { extractTrackNumber, getMp3Files } from './trackUtils.js';
import * as mm from 'music-metadata';

export type { AlbumTags } from './types.js';

function readTags(filePath: string): Id3Tags {
    return NodeID3.read(filePath) as unknown as Id3Tags;
}

export async function getTags(folderPath: string): Promise<AlbumTags> {
    const mp3Files = await getMp3Files(folderPath);

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
        let tags: Id3Tags;
        try {
            tags = readTags(filePath);
        } catch (err) {
            logger.warn(`skipping corrupt file ${file}: ${(err as Error).message}`);
            continue;
        }
        const stat = await fs.stat(filePath);

        const trackNum = extractTrackNumber(file, tags) || '00';

        filePaths.push(filePath);
        trackNums[filePath] = trackNum;
        if (tags.title) trackTitles[filePath] = tags.title as string;
        if (tags.artist) {
            trackArtistsMap[filePath] = tags.artist as string;
            trackArtistsSet.add(tags.artist as string);
        }
        if (tags.performerInfo) albumArtistsSet.add(tags.performerInfo as string);

        // ----- duration detection -----
        let durationSec: number | undefined = undefined;

        // 1. Try music-metadata for accurate duration
        try {
            const metadata = await mm.parseFile(filePath);
            if (metadata.format?.duration !== null && typeof metadata.format.duration === 'number') {
                durationSec = Math.round(metadata.format.duration);
            }
        } catch (err) {
            // fallback to ID3/bitrate methods
            // logger.debug(`music-metadata failed for ${filePath}: ${err}`);
        }

        // 2. Try TLEN (milliseconds) from ID3
        if (durationSec === undefined && tags.TLEN !== undefined) {
            const ms = Number(tags.TLEN);
            if (!isNaN(ms)) {
                durationSec = Math.round(ms / 1000);
            }
        }
        // 3. Try length field (could be seconds or milliseconds)
        if (durationSec === undefined && tags.length !== undefined) {
            const len = Number(tags.length);
            if (!isNaN(len)) {
                // Heuristic: if value > 1000 assume milliseconds
                durationSec = len > 1000 ? Math.round(len / 1000) : Math.round(len);
            }
        }
        // 4. Fallback to bitrate from tags
        if (durationSec === undefined && tags.bitrate !== undefined) {
            const bitrate = Number(tags.bitrate);
            if (!isNaN(bitrate) && bitrate > 0) {
                durationSec = Math.round((stat.size * 8) / (bitrate * 1000));
            }
        }
        // 5. Fallback: assume constant bitrate 128 kbps
        if (durationSec === undefined) {
            durationSec = Math.round((stat.size * 8) / (128 * 1000)); // 128 kbps
        }
        // Ensure non‑negative
        if (durationSec < 0) durationSec = 0;

        trackDurations[filePath] = durationSec;
    }

    if (Object.keys(trackDurations).length === 0) {
        logger.warn(`no trackDurations found for ${folderPath} — MP3 files may lack TLEN frame`);
    }

    if (filePaths.length === 0) {
        throw new Error('No readable MP3 files found in this folder');
    }

    // Album-level info from first file
    let firstTags: Id3Tags;
    try {
        firstTags = readTags(filePaths[0]!);
    } catch (err) {
        logger.warn(`failed to read album tags from ${path.basename(filePaths[0]!)}: ${(err as Error).message}`);
        firstTags = {} as Id3Tags;
    }
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
        let tags: Id3Tags;
        try {
            tags = readTags(filePath);
        } catch {
            continue;
        }

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