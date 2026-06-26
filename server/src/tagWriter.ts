import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import type { AlbumTags, Id3Tags } from './types.js';
import { extractTrackNumber, getMp3Files, assertInsideMusicRoot } from './trackUtils.js';

export type { AlbumTags } from './types.js';

export interface WriteOptions {
    folderPath: string;
    tags: AlbumTags;
    // ALL keys = FULL FILE PATHS (immutable identifiers)
    trackArtists?: Record<string, string>;
    trackNames?: Record<string, string>;
}

// ── Write ID3 tags by full file path ────────────────────────────────

export async function writeTags(options: WriteOptions, musicRoot?: string): Promise<void> {
    const { folderPath, tags, trackArtists, trackNames } = options;
    if (musicRoot) assertInsideMusicRoot(folderPath, musicRoot);
    const mp3Files = await getMp3Files(folderPath);

    for (const file of mp3Files) {
        const filePath = path.join(folderPath, file);
        await writeSingleTag(filePath, tags, trackArtists, trackNames);
    }
}

async function writeSingleTag(
    filePath: string,
    tags: AlbumTags,
    trackArtists?: Record<string, string>,
    trackNames?: Record<string, string>,
): Promise<void> {
    const currentTags = NodeID3.read(filePath) as unknown as Id3Tags;

    // Key by FULL PATH — this never changes
    const perTrackArtist = trackArtists?.[filePath];
    const perTrackName = trackNames?.[filePath];

    const rawYear = tags.year || currentTags.year;
    const validYear = rawYear && /^\d{4}$/.test(rawYear) ? String(rawYear) : currentTags.year;

    const resolvedArtist = Array.isArray(tags.artist) ? tags.artist[0] : tags.artist;
    const resolvedAlbumArtist = Array.isArray(tags.albumArtist) ? tags.albumArtist[0] : tags.albumArtist;

    const updatedTags = {
        ...currentTags,
        artist: perTrackArtist || resolvedArtist || currentTags.artist,
        performerInfo: resolvedAlbumArtist || currentTags.performerInfo,
        album: tags.album || currentTags.album,
        year: validYear,
        recordingTime: undefined,
        genre: tags.genre || currentTags.genre,
        publisher: tags.label || currentTags.publisher,
    };

    if (perTrackName !== undefined) {
        updatedTags.title = perTrackName;
    }

    const customFields: Record<string, string | undefined> = {
        'Country': tags.country,
        'RELEASETYPE': tags.releaseType,
        'DGC_POST_ID': tags.postId != null ? String(tags.postId) : undefined,
        'DEEZER_ID': tags.deezerId != null ? String(tags.deezerId) : undefined,
        'MusicBrainz Album Id': (tags as any).musicbrainzReleaseId,
        'MusicBrainz Artist Id': (tags as any).musicbrainzArtistId,
        'MusicBrainz Album Artist Id': (tags as any).musicbrainzAlbumArtistId,
        'MusicBrainz Release Group Id': (tags as any).musicbrainzReleaseGroupId,
        'CATALOGNUMBER': (tags as any).catalogNumber,
        'DISCID': (tags as any).discId,
        'originalyear': (tags as any).originalYear,
    };
    if ((tags as any).extraTags && typeof (tags as any).extraTags === 'object') {
        for (const [k, v] of Object.entries((tags as any).extraTags as Record<string, string>)) {
            if (v !== undefined && v !== '') customFields[k] = v;
        }
    }
    logger.info(`[writeSingleTag] custom fields: ${JSON.stringify(customFields)}`);
    updatedTags.userDefinedText = writeUserDefinedText(
        (currentTags.userDefinedText as { description?: string; value?: string }[]) || [],
        customFields
    );

    let fileBuffer: Buffer;
    if (currentTags._buffer && typeof currentTags._buffer === 'object' && 'length' in currentTags._buffer) {
        fileBuffer = Buffer.from(currentTags._buffer as unknown as ArrayBuffer);
    } else {
        fileBuffer = await fs.readFile(filePath);
    }
    const updatedBuffer = NodeID3.write(updatedTags as any, fileBuffer);
    if (updatedBuffer && updatedBuffer.length > 0) {
        await fs.writeFile(filePath, updatedBuffer);
    }
}

function writeUserDefinedText(
    current: { description?: string; value?: string }[],
    fields: Record<string, string | undefined>,
): { description?: string; value?: string }[] {
    const result = [...current];
    const findIdx = (desc: string) =>
        result.findIndex((t) => t.description?.toLowerCase() === desc.toLowerCase());

    for (const [desc, value] of Object.entries(fields)) {
        const idx = findIdx(desc);
        if (value !== undefined && value !== '') {
            if (idx > -1) {
                result[idx] = { ...result[idx], description: desc, value };
            } else {
                result.push({ description: desc, value });
            }
        } else if (idx > -1) {
            result.splice(idx, 1);
        }
    }

    return result;
}

// ── Rename files in-place by full path ──────────────────────────────

export async function renameFilesInPlace(
    folderPath: string,
    albumArtist?: string,
    trackArtists?: Record<string, string>,
    trackNames?: Record<string, string>,
    musicRoot?: string,
): Promise<{ renamed: { from: string; to: string }[] }> {
    if (musicRoot) assertInsideMusicRoot(folderPath, musicRoot);
    const mp3Files = await getMp3Files(folderPath);
    const renamed: { from: string; to: string }[] = [];

    for (const file of mp3Files) {
        const filePath = path.join(folderPath, file);
        const tags = NodeID3.read(filePath) as unknown as Id3Tags;

        const trackNumPadded = (extractTrackNumber(file, tags) || '00').padStart(2, '0');
        const ext = path.extname(file);

        // Key by FULL PATH — stable identifier
        const perTrackArtist = trackArtists?.[filePath];
        const perTrackName = trackNames?.[filePath];

        // Use per-track artist from the map ONLY — never fall back to ID3
        // because writeTags already overwrote it with album-level data
        const trackArtist = perTrackArtist ? sanitize(perTrackArtist) : sanitize(albumArtist || 'Unknown Artist');
        const trackTitle = perTrackName ? sanitize(perTrackName) : sanitize(tags.title || '');

        const newName = `${trackNumPadded}. ${trackArtist} - ${trackTitle}${ext}`;

        if (file !== newName) {
            const newPath = path.join(folderPath, newName);
            try {
                await fs.rename(filePath, newPath);
                logger.info(`renamed: ${file} → ${newName}`);
                renamed.push({ from: file, to: newName });
            } catch (err) {
                logger.error(`failed to rename ${file}: ${(err as Error).message}`);
            }
        }
    }

    return { renamed };
}

// ── Move folder with renamed files ──────────────────────────────────

export async function moveProcessedFiles(
    sourceFolder: string,
    outputRoot: string,
    musicRoot: string,
    newTags: AlbumTags,
    albumArtist?: string,
    trackArtists?: Record<string, string>,
    trackNames?: Record<string, string>,
    outputMode?: 'subfolder' | 'absolute',
    yearOverride?: string,
    albumOverride?: string,
    cleanupIgnorePatterns?: string[],
): Promise<{ moved: string[] }> {
    const resolvedOutput = path.resolve(outputRoot);
    const resolvedMusicRoot = path.resolve(musicRoot);
    if (outputMode !== 'absolute' && !resolvedOutput.startsWith(resolvedMusicRoot)) {
        throw new Error('Output directory must be inside music root');
    }
    const resolvedSource = path.resolve(sourceFolder);
    if (!resolvedSource.startsWith(resolvedMusicRoot)) {
        throw new Error('Source directory must be inside music root');
    }

    // NOTE: rename is done by the caller (index.ts), not here.
    // Metadata is passed directly to avoid re-reading files after rename.

    const resolvedAlbumArtist = albumArtist || 'Unknown Artist';
    const yearTag = yearOverride || '0000';
    const albumTag = sanitize(albumOverride || 'Unknown Album');

    const artistDir = path.join(outputRoot, sanitize(resolvedAlbumArtist));
    const albumDirName = `${yearTag} - ${albumTag}`;

    let destDir: string;
    let counter = 1;
    do {
        const candidate = counter === 1
            ? path.join(artistDir, albumDirName)
            : path.join(artistDir, `${albumDirName} (${counter})`);
        try {
            await fs.access(candidate);
            counter++;
        } catch {
            destDir = candidate;
            break;
        }
    } while (true);

    await fs.mkdir(artistDir, { recursive: true });

    if (path.resolve(sourceFolder) === path.resolve(destDir!)) {
        const moved = await getMp3Files(sourceFolder);
        return { moved };
    }

    try {
        await fs.rename(sourceFolder, destDir!);
        logger.info(`moved folder: ${sourceFolder} → ${destDir}`);
        await cleanEmptyFolders(path.dirname(sourceFolder), resolvedMusicRoot, cleanupIgnorePatterns);
    } catch {
        // Fallback: copy then delete
        await fs.mkdir(destDir!, { recursive: true });
        const allEntries = await fs.readdir(sourceFolder, { withFileTypes: true });
        let copyFailed = false;
        for (const entry of allEntries) {
            const src = path.join(sourceFolder, entry.name);
            const dst = path.join(destDir!, entry.name);
            try {
                if (entry.isDirectory()) {
                    await copyDirRecursive(src, dst);
                } else {
                    await fs.copyFile(src, dst);
                }
            } catch (err) {
                copyFailed = true;
                logger.error(`failed to copy ${entry.name}: ${(err as Error).message}`);
            }
        }
        if (!copyFailed) {
            await fs.rm(sourceFolder, { recursive: true, force: true });
            await cleanEmptyFolders(path.dirname(sourceFolder), resolvedMusicRoot, cleanupIgnorePatterns);
        }
    }

    const moved = await getMp3Files(destDir!);
    return { moved };
}

function sanitize(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
}

async function cleanEmptyFolders(dir: string, stopAt: string, ignorePatterns: string[] = []): Promise<void> {
    const resolvedDir = path.resolve(dir);
    if (resolvedDir === stopAt || !resolvedDir.startsWith(stopAt)) return;
    try {
        const entries = await fs.readdir(dir);
        const realEntries = entries.filter(e => !ignorePatterns.includes(e));
        if (realEntries.length === 0) {
            await fs.rm(dir, { recursive: true, force: true });
            logger.debug(`removed empty folder: ${dir}`);
            await cleanEmptyFolders(path.dirname(dir), stopAt, ignorePatterns);
        }
    } catch (e) { logger.debug(`cleanEmptyFolders: ${(e as Error).message}`); }
}

async function copyDirRecursive(src: string, dst: string): Promise<void> {
    await fs.mkdir(dst, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
            await copyDirRecursive(srcPath, dstPath);
        } else {
            await fs.copyFile(srcPath, dstPath);
        }
    }
}
