import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import type { AlbumTags } from './types.js';
import { getBandDiscography } from './scraper.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const LIBRARY_ROOT = path.join(__dirname, '../../library');

export interface LibraryAlbum {
    postId: number;
    bandId: number;
    bandName: string;
    artist: string;
    album: string;
    year: string | null;
    genre: string | null;
    label: string | null;
    releaseType: string | null;
    coverUrl: string | null;
    inLibrary: boolean;
    dateAdded: string;
}

// ── Helpers ──

function albumPath(bandId: number, postId: number): string {
    return path.join(LIBRARY_ROOT, String(bandId), String(postId), 'album.json');
}

async function readAlbum(bandId: number, postId: number): Promise<LibraryAlbum | null> {
    try {
        const data = await fs.readFile(albumPath(bandId, postId), 'utf-8');
        const album = JSON.parse(data) as LibraryAlbum;
        logger.debug(`library: read ${bandId}/${postId} — inLibrary=${album.inLibrary}`);
        return album;
    } catch {
        return null;
    }
}

async function writeAlbum(album: LibraryAlbum): Promise<void> {
    const dir = path.join(LIBRARY_ROOT, String(album.bandId), String(album.postId));
    await fs.mkdir(dir, { recursive: true });
    const filePath = albumPath(album.bandId, album.postId);
    await fs.writeFile(filePath, JSON.stringify(album, null, 2), 'utf-8');
    logger.debug(`library: wrote ${filePath} — inLibrary=${album.inLibrary}`);
}

async function downloadCover(url: string, dest: string): Promise<void> {
    logger.debug(`library: downloading cover ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`cover download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    logger.debug(`library: cover saved ${dest} (${buf.length} bytes)`);
}

async function saveCover(bandId: number, postId: number, coverUrl: string | null): Promise<void> {
    if (!coverUrl) {
        logger.debug(`library: no coverUrl for ${bandId}/${postId}, skipping`);
        return;
    }
    const dir = path.join(LIBRARY_ROOT, String(bandId), String(postId));
    const ext = coverUrl.includes('.webp') ? 'webp' : 'jpg';
    const coverPath = path.join(dir, `cover.${ext}`);
    try {
        await downloadCover(coverUrl, coverPath);
    } catch (e) {
        logger.warn(`library: cover download failed for ${bandId}/${postId}: ${(e as Error).message}`);
    }
}

// ── Save album (owned) ──

export async function saveAlbumToLibrary(tags: AlbumTags, coverUrl: string | null): Promise<void> {
    const postId = tags.postId;
    const bandId = tags.bandId;
    if (!postId || !bandId) {
        logger.warn(`library: saveAlbumToLibrary skipped — postId=${postId}, bandId=${bandId}`);
        return;
    }

    logger.info(`library: saving album ${bandId}/${postId} — "${tags.artist}" — "${tags.album}"`);

    const existing = await readAlbum(bandId, postId);
    if (existing) {
        logger.info(`library: album ${bandId}/${postId} already exists (inLibrary=${existing.inLibrary}), updating`);
    }

    const album: LibraryAlbum = {
        postId,
        bandId,
        bandName: existing?.bandName || tags.artist || 'Unknown',
        artist: tags.artist || 'Unknown',
        album: tags.album || 'Unknown',
        year: tags.year || null,
        genre: tags.genre || null,
        label: tags.label || null,
        releaseType: tags.releaseType || null,
        coverUrl,
        inLibrary: true,
        dateAdded: existing?.dateAdded || new Date().toISOString(),
    };

    await writeAlbum(album);
    logger.info(`library: album.json saved for ${bandId}/${postId}`);

    await saveCover(bandId, postId, coverUrl);
    logger.info(`library: cover saved for ${bandId}/${postId}`);

    // Background: populate full discography
    logger.info(`library: starting discography populate for band ${bandId} (background)`);
    populateBandDiscography(bandId, postId).then(created => {
        logger.info(`library: discography populate done for band ${bandId} — ${created} albums created`);
    }).catch(e =>
        logger.warn(`library: discography populate failed for band ${bandId}: ${(e as Error).message}`)
    );
}

// ── Populate discography (background) ──

async function populateBandDiscography(bandId: number, ownedPostId: number): Promise<number> {
    logger.info(`library: populating discography for band ${bandId}...`);

    // Get existing album.json files for this band
    const bandDir = path.join(LIBRARY_ROOT, String(bandId));
    const existingPostIds = new Set<number>();
    try {
        const entries = await fs.readdir(bandDir);
        for (const entry of entries) {
            const pid = parseInt(entry, 10);
            if (!isNaN(pid)) existingPostIds.add(pid);
        }
    } catch { }
    logger.info(`library: band ${bandId} has ${existingPostIds.size} existing album folders`);

    logger.info(`library: fetching discography from DGC for band ${bandId}...`);
    const disco = await getBandDiscography(bandId).catch((e: Error) => {
        logger.warn(`library: DGC discography fetch failed for band ${bandId}: ${e.message}`);
        return null;
    });

    if (!disco) {
        logger.warn(`library: could not fetch discography for band ${bandId}`);
        return 0;
    }

    logger.info(`library: DGC returned ${disco.albums.length} albums for "${disco.bandName}"`);

    let created = 0;
    let skipped = 0;
    for (const d of disco.albums) {
        if (existingPostIds.has(d.postId)) {
            skipped++;
            logger.debug(`library: skipping postId ${d.postId} "${d.album}" — already exists`);
            continue;
        }

        logger.info(`library: creating album.json for postId ${d.postId} "${d.album}" (${d.year}) — inLibrary=${d.postId === ownedPostId}`);

        const album: LibraryAlbum = {
            postId: d.postId,
            bandId,
            bandName: disco.bandName,
            artist: d.artist,
            album: d.album || 'Unknown',
            year: d.year,
            genre: d.genres?.[0] || null,
            label: d.label,
            releaseType: d.releaseType,
            coverUrl: d.coverUrl,
            inLibrary: d.postId === ownedPostId,
            dateAdded: new Date().toISOString(),
        };

        await writeAlbum(album);
        if (d.coverUrl) await saveCover(bandId, d.postId, d.coverUrl);
        created++;

        // Delay between covers to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    logger.info(`library: discography populate summary for "${disco.bandName}": ${created} created, ${skipped} skipped (already existed)`);
    return created;
}

// ── Read library ──

export async function getAllLibraryAlbums(): Promise<LibraryAlbum[]> {
    logger.info(`library: loading all albums from ${LIBRARY_ROOT}`);
    const albums: LibraryAlbum[] = [];
    try {
        const bandDirs = await fs.readdir(LIBRARY_ROOT);
        logger.info(`library: found ${bandDirs.length} band directories`);
        for (const bandDir of bandDirs) {
            const bandId = parseInt(bandDir, 10);
            if (isNaN(bandId)) {
                logger.debug(`library: skipping non-numeric dir "${bandDir}"`);
                continue;
            }
            const bandPath = path.join(LIBRARY_ROOT, bandDir);
            try {
                const postDirs = await fs.readdir(bandPath);
                for (const postDir of postDirs) {
                    const pid = parseInt(postDir, 10);
                    if (isNaN(pid)) continue;
                    const album = await readAlbum(bandId, pid);
                    if (album) albums.push(album);
                }
            } catch { }
        }
    } catch (e) {
        logger.warn(`library: failed to read library root: ${(e as Error).message}`);
    }
    const owned = albums.filter(a => a.inLibrary).length;
    logger.info(`library: loaded ${albums.length} albums (${owned} owned, ${albums.length - owned} missing)`);
    return albums;
}

export async function getBandAlbums(bandId: number): Promise<LibraryAlbum[]> {
    logger.info(`library: loading albums for band ${bandId}`);
    const bandDir = path.join(LIBRARY_ROOT, String(bandId));
    const albums: LibraryAlbum[] = [];
    try {
        const postDirs = await fs.readdir(bandDir);
        for (const postDir of postDirs) {
            const pid = parseInt(postDir, 10);
            if (isNaN(pid)) continue;
            const album = await readAlbum(bandId, pid);
            if (album) albums.push(album);
        }
    } catch { }
    const owned = albums.filter(a => a.inLibrary).length;
    logger.info(`library: band ${bandId} has ${albums.length} albums (${owned} owned)`);
    return albums;
}
