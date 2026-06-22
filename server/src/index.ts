import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs, { readdirSync } from 'fs';
import fsPromises from 'fs/promises';
import { createServer as createViteServer } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
import { getLibraryTree, getDirectoryChildren } from './scanner.js';
import { getTags, type AlbumTags } from './tagger.js';
import NodeID3 from 'node-id3';
import { writeTags, moveProcessedFiles, renameFilesInPlace } from './tagWriter.js';
import { searchAlbums, getAlbumDetails, fetchPageContent, parseGenresFromPage, getBrowserStatus, ensureTaxonomy } from './scraper.js';
import { loadConfig, saveConfig, type Config, type TagDefaults } from './config.js';
import { clearCache } from './cache.js';
import { searchDeezer } from './deezer.js';
import { logger } from './logger.js';

const app = express();

// Config store — avoids module-level mutable variable
const configStore = {
    config: await loadConfig(),
};

function getConfig(): Config {
    return configStore.config;
}

function getOutputRoot(cfg?: Config) {
    const c = cfg || getConfig();
    if (c.outputMode === 'absolute') {
        return path.resolve(c.outputFolder);
    }
    return path.join(c.musicRoot, c.outputFolder);
}

const DEV = process.env.NODE_ENV !== 'production';
const DIST_DIR = path.join(__dirname, '../../client/dist');

// ─── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Vite integration (dev only) ────────────────────────────────
let vite: Awaited<ReturnType<typeof createViteServer>> | undefined;
if (DEV) {
    vite = await createViteServer({
        root: path.resolve(__dirname, '../../client'),
        server: {
            middlewareMode: true,
        },
        appType: 'spa',
    });
}

// ─── API Routes (must be before Vite middleware) ────────────────

app.get('/api/config', (_req, res) => {
    res.json(getConfig());
});

app.post('/api/config', async (req, res) => {
    const { musicRoot, port, tagDefaults, writeTrackNames, writeTrackArtists, outputFolder, outputMode } = req.body;
    if (!musicRoot || typeof musicRoot !== 'string') {
        return res.status(400).json({ error: 'musicRoot is required' });
    }
    const current = getConfig();
    const newConfig: Config = {
        musicRoot: path.resolve(musicRoot),
        port: typeof port === 'number' ? port : current.port,
        tagDefaults: { ...current.tagDefaults, ...(tagDefaults || {}) },
        writeTrackNames: typeof writeTrackNames === 'boolean' ? writeTrackNames : current.writeTrackNames,
        writeTrackArtists: typeof writeTrackArtists === 'boolean' ? writeTrackArtists : current.writeTrackArtists,
        outputFolder: typeof outputFolder === 'string' && outputFolder.trim() ? outputFolder.trim() : current.outputFolder,
        outputMode: outputMode === 'absolute' ? 'absolute' : 'subfolder',
    };
    await saveConfig(newConfig);
    configStore.config = newConfig;
    logger.info(`updated: musicRoot=${newConfig.musicRoot}, port=${newConfig.port}`);
    res.json({ success: true, config: newConfig });
});

app.post('/api/config/write-track-names', async (req, res) => {
    const { enabled } = req.body;
    const current = getConfig();
    configStore.config = { ...current, writeTrackNames: !!enabled };
    await saveConfig(configStore.config);
    logger.info(`writeTrackNames=${configStore.config.writeTrackNames}`);
    res.json({ success: true, writeTrackNames: configStore.config.writeTrackNames });
});

app.post('/api/config/write-track-artists', async (req, res) => {
    const { enabled } = req.body;
    const current = getConfig();
    configStore.config = { ...current, writeTrackArtists: !!enabled };
    await saveConfig(configStore.config);
    logger.info(`writeTrackArtists=${configStore.config.writeTrackArtists}`);
    res.json({ success: true, writeTrackArtists: configStore.config.writeTrackArtists });
});

app.get('/api/library', async (_req, res) => {
    try {
        const cfg = getConfig();
        const tree = await getLibraryTree(cfg.musicRoot);
        res.json(tree);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/library/children', async (req, res) => {
    const { dirPath } = req.query;
    if (!dirPath || typeof dirPath !== 'string') {
        return res.status(400).json({ error: 'dirPath is required' });
    }

    try {
        const cfg = getConfig();
        const absolutePath = path.resolve(dirPath);
        if (!absolutePath.startsWith(path.resolve(cfg.musicRoot))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const children = await getDirectoryChildren(absolutePath);
        res.json(children);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/tags', async (req, res) => {
    const { folderPath } = req.query;
    if (!folderPath || typeof folderPath !== 'string') {
        return res.status(400).json({ error: 'folderPath is required' });
    }

    try {
        const cfg = getConfig();
        const absolutePath = path.resolve(folderPath);
        if (!absolutePath.startsWith(path.resolve(cfg.musicRoot))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const tags = await getTags(absolutePath);
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    logger.info(`POST /api/search query="${query}"`);
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const results = await searchAlbums(query);
        logger.info(`POST /api/search → ${results.length} results`);
        res.json(results);
    } catch (error) {
        logger.error(`POST /api/search error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/post/:id', async (req, res) => {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const details = await getAlbumDetails(postId);
        res.json(details);
    } catch (error) {
        logger.error(`POST /api/post/${req.params.id} error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/tags/update', async (req, res) => {
    const { folderPath, tags, trackArtists, trackNames, moveFiles, renameFiles } = req.body;
    if (!folderPath || !tags) return res.status(400).json({ error: 'folderPath and tags are required' });

    logger.info(`[updateTags] trackArtists keys=${trackArtists ? Object.keys(trackArtists).join(',') : 'none'} trackNames keys=${trackNames ? Object.keys(trackNames).join(',') : 'none'}`);

    try {
        const cfg = getConfig();
        const absolutePath = path.resolve(folderPath);
        if (!absolutePath.startsWith(path.resolve(cfg.musicRoot))) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await writeTags({ folderPath: absolutePath, tags, trackArtists, trackNames });

        let moved: string[] | undefined;
        let renamed: string[] | undefined;
        if (moveFiles) {
            // Capture original filenames AND read album metadata BEFORE rename
            const origFiles = await fsPromises.readdir(absolutePath);
            const origMp3 = origFiles.filter((f: string) => f.toLowerCase().endsWith('.mp3'));
            
            // Read album metadata from first file BEFORE it gets renamed/rewritten
            let albumArtistForMove: string | undefined;
            let yearForMove: string | undefined;
            let albumForMove: string | undefined;
            if (origMp3[0]) {
                try {
                    const ft = NodeID3.read(path.join(absolutePath, origMp3[0]));
                    albumArtistForMove = tags.albumArtist || tags.artist;
                    yearForMove = tags.year || (ft as any)?.year;
                    albumForMove = tags.album;
                } catch {}
            }
            
            // MOVE always includes rename — rename in-place first, then move folder
            const renameResult = await renameFilesInPlace(absolutePath, tags.artist, trackArtists, trackNames);
            renamed = renameResult.renamed;
            logger.info(`[updateTags] pre-rename: ${JSON.stringify(renameResult)}`);
            // Pass metadata directly — no need to re-read files after rename
            const result = await moveProcessedFiles(
                absolutePath, getOutputRoot(cfg), cfg.musicRoot, tags,
                albumArtistForMove,
                trackArtists, trackNames,
                cfg.outputMode, yearForMove, albumForMove
            );
            moved = result.moved;
        } else if (renameFiles) {
            const result = await renameFilesInPlace(absolutePath, tags.artist, trackArtists, trackNames);
            renamed = result.renamed;
            logger.info(`[updateTags] rename: ${JSON.stringify(result)}`);
        }
        res.json({ success: true, moved, renamed });
    } catch (error) {
        logger.error(`POST /api/tags/update error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

const ALLOWED_WEBFETCH_HOSTS = ['deathgrind.club', 'cdn.deathgrind.club'];

function isAllowedWebfetchUrl(urlStr: string): boolean {
    try {
        const parsed = new URL(urlStr);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
        return ALLOWED_WEBFETCH_HOSTS.includes(parsed.hostname);
    } catch {
        return false;
    }
}

app.get('/api/webfetch', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url is required' });
    }

    if (!isAllowedWebfetchUrl(url)) {
        return res.status(403).json({ error: 'Only deathgrind.club URLs are allowed' });
    }

    try {
        const content = await fetchPageContent(url);
        res.json({ content });
    } catch (error) {
        logger.error(`webfetch error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/parse-genres', async (req, res) => {
    const { html } = req.body;
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'html is required' });
    }

    try {
        const { genres, types } = await parseGenresFromPage(html);
        res.json({ genres, types });
    } catch (error) {
        logger.error(`parse-genres error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/browser/status', (_req, res) => {
    res.json(getBrowserStatus());
});

app.post('/api/cache/clear', async (_req, res) => {
    try {
        const cleared = await clearCache();
        res.json({ success: true, cleared });
    } catch (error) {
        logger.error(`cache/clear error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/search-deezer', async (req, res) => {
    const { artist, album } = req.body;
    logger.info(`POST /api/search-deezer artist="${artist || ''}" album="${album || ''}"`);
    if (!artist && !album) return res.status(400).json({ error: 'artist or album is required' });

    try {
        const results = await searchDeezer(artist, album);
        logger.info(`POST /api/search-deezer → ${results.length} results`);
        res.json(results);
    } catch (error) {
        logger.error(`POST /api/search-deezer error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// ─── Vite integration (dev only) — must be after API routes ────
if (DEV && vite) {
    app.use(vite.middlewares);
}

// ─── SPA fallback (prod only) ───────────────────────────────────
// In dev mode, Vite handles SPA fallback via middlewareMode + appType: 'spa'
if (!DEV) {
    app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
}

// ─── Start ──────────────────────────────────────────────────────
(async () => {
    try {
        logger.info('Loading taxonomy from DGC...');
        await ensureTaxonomy();
        const cfg = getConfig();
        const server = app.listen(cfg.port);
        logger.info(`Server running at http://localhost:${cfg.port} (single process, Vite + Express)`);
        logger.info(`Music root: ${cfg.musicRoot}`);
    } catch (err) {
        logger.error('Fatal startup error:', err);
        process.exit(1);
    }
})();
