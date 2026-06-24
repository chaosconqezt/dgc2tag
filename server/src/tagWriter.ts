import NodeID3 from 'node-id3';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import type { AlbumTags } from './types.js';

export type { AlbumTags } from './types.js';

interface Id3Tags {
    artist?: string;
    album?: string;
    albumArtist?: string;
    genre?: string;
    year?: string;
    track?: number;
    title?: string;
    length?: number;
    bitrate?: number;
    audioFormat?: string;
    notes?: string;
    publisher?: string;
    performerInfo?: string;
    [key: string]: unknown;
}

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
    if (musicRoot) {
        const resolved = path.resolve(folderPath);
        if (!resolved.startsWith(path.resolve(musicRoot))) {
            throw new Error('folderPath must be inside musicRoot');
        }
    }
    const files = await fs.readdir(folderPath);
    const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));

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

    const updatedTags: any = {
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

    updatedTags.userDefinedText = writeUserDefinedText(
        (currentTags.userDefinedText as { description?: string; value?: string }[]) || [],
        tags.country,
        tags.releaseType,
        tags.postId != null ? String(tags.postId) : undefined,
        tags.deezerId != null ? String(tags.deezerId) : undefined
    );

    let fileBuffer: Buffer;
    if (currentTags._buffer && typeof currentTags._buffer === 'object' && 'length' in currentTags._buffer) {
        fileBuffer = Buffer.from(currentTags._buffer as unknown as ArrayBuffer);
    } else {
        fileBuffer = await fs.readFile(filePath);
    }
    const updatedBuffer = NodeID3.write(updatedTags, fileBuffer);
    if (updatedBuffer && updatedBuffer.length > 0) {
        await fs.writeFile(filePath, updatedBuffer);
    }
}

function writeUserDefinedText(
    current: any[],
    country?: string,
    releaseType?: string,
    postId?: string,
    deezerId?: string,
): any[] {
    const result = [...current];
    const findIdx = (desc: string) =>
        result.findIndex((t: any) => t.description?.toLowerCase() === desc.toLowerCase());

    const setField = (desc: string, value: string | undefined) => {
        const idx = findIdx(desc);
        if (value !== undefined) {
            if (idx > -1) {
                result[idx] = { ...result[idx], description: desc, value };
            } else if (value) {
                result.push({ description: desc, value });
            }
        } else if (idx > -1) {
            result.splice(idx, 1);
        }
    };

    setField('Country', country);
    setField('RELEASETYPE', releaseType);
    setField('DGC_POST_ID', postId);
    setField('DEEZER_ID', deezerId);
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
    if (musicRoot) {
        const resolved = path.resolve(folderPath);
        if (!resolved.startsWith(path.resolve(musicRoot))) {
            throw new Error('folderPath must be inside musicRoot');
        }
    }
    const files = await fs.readdir(folderPath);
    const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));
    const renamed: { from: string; to: string }[] = [];

    for (const file of mp3Files) {
        const filePath = path.join(folderPath, file);
        const tags = NodeID3.read(filePath) as unknown as Id3Tags;

        // Extract track number from ID3 or filename
        let trackNum = '00';
        if (tags.track) {
            const t = String(tags.track);
            const slashIdx = t.indexOf('/');
            const numStr = slashIdx > 0 ? t.slice(0, slashIdx) : t;
            const m = numStr.match(/^(\d+)/);
            if (m?.[1]) trackNum = m[1];
        }
        if (!trackNum || trackNum === '00') {
            if (tags.trackNumber) {
                const tn = String(tags.trackNumber);
                const slashIdx = tn.indexOf('/');
                const extracted = slashIdx > 0 ? tn.slice(0, slashIdx) : tn;
                if (/^\d+$/.test(extracted)) trackNum = extracted;
            }
        }
        if (!trackNum || trackNum === '00') {
            const numMatch = file.match(/^(\d{1,3})/);
            if (numMatch?.[1]) trackNum = numMatch[1];
        }
        const trackNumPadded = (trackNum ?? '00').padStart(2, '0');
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
        const count = (await fs.readdir(sourceFolder)).filter((f: string) => f.toLowerCase().endsWith('.mp3')).length;
        return { moved: Array(count).fill(0).map((_, i) => `file_${i + 1}`) };
    }

    try {
        await fs.rename(sourceFolder, destDir!);
        logger.info(`moved folder: ${sourceFolder} → ${destDir}`);
        await cleanEmptyFolders(path.dirname(sourceFolder), resolvedMusicRoot);
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
            await cleanEmptyFolders(path.dirname(sourceFolder), resolvedMusicRoot);
        }
    }

    const count = (await fs.readdir(destDir!)).filter((f: string) => f.toLowerCase().endsWith('.mp3')).length;
    return { moved: Array(count).fill(0).map((_, i) => `file_${i + 1}`) };
}

function sanitize(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
}

async function cleanEmptyFolders(dir: string, stopAt: string): Promise<void> {
    const resolvedDir = path.resolve(dir);
    if (resolvedDir === stopAt || !resolvedDir.startsWith(stopAt)) return;
    try {
        const entries = await fs.readdir(dir);
        if (entries.length === 0) {
            await fs.rmdir(dir);
            logger.debug(`removed empty folder: ${dir}`);
            await cleanEmptyFolders(path.dirname(dir), stopAt);
        }
    } catch {}
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
