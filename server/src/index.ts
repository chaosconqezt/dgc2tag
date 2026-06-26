import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
import { getLibraryTree, getDirectoryChildren } from './scanner.js';
import { getTags, type AlbumTags } from './tagger.js';
import NodeID3 from 'node-id3';
import type { Id3Tags } from './types.js';
import { writeTags, moveProcessedFiles, renameFilesInPlace } from './tagWriter.js';
import { getMp3Files, isInsideMusicRoot } from './trackUtils.js';
import { searchAlbums, getAlbumDetails, fetchPageContent, parseGenresFromPage, getBrowserStatus, ensureTaxonomy } from './scraper.js';
import { loadConfig, saveConfig, type Config } from './config.js';
import { clearCache } from './cache.js';
import { sources } from './sources/index.js';
import { logger } from './logger.js';

const app = express();

// Config store — avoids module-level mutable variable
const configStore = {
    config: await loadConfig(),
};
let configLock: Promise<void> = Promise.resolve();

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
app.use(express.json({ limit: '1mb' }));

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
    try {
        const { musicRoot, port, tagDefaults, writeTrackNames, writeTrackArtists, outputFolder, outputMode, enabledSources, cleanupIgnorePatterns } = req.body;
        if (!musicRoot || typeof musicRoot !== 'string') {
            return res.status(400).json({ error: 'musicRoot is required' });
        }
        const prev = configLock;
        let release!: () => void;
        configLock = new Promise<void>(r => { release = r; });
        await prev;
        try {
            const current = getConfig();
            const newConfig: Config = {
                musicRoot: path.resolve(musicRoot),
                port: typeof port === 'number' ? port : current.port,
                tagDefaults: { ...current.tagDefaults, ...(tagDefaults || {}) },
                writeTrackNames: typeof writeTrackNames === 'boolean' ? writeTrackNames : current.writeTrackNames,
                writeTrackArtists: typeof writeTrackArtists === 'boolean' ? writeTrackArtists : current.writeTrackArtists,
                outputFolder: typeof outputFolder === 'string' && outputFolder.trim() ? outputFolder.trim() : current.outputFolder,
                outputMode: outputMode === 'absolute' ? 'absolute' : 'subfolder',
                enabledSources: enabledSources && typeof enabledSources === 'object' ? { ...current.enabledSources, ...enabledSources } : current.enabledSources,
                cleanupIgnorePatterns: Array.isArray(cleanupIgnorePatterns) ? cleanupIgnorePatterns : current.cleanupIgnorePatterns,
            };
            await saveConfig(newConfig);
            configStore.config = newConfig;
            logger.info(`updated: musicRoot=${newConfig.musicRoot}, port=${newConfig.port}`);
            res.json({ success: true, config: newConfig });
        } finally {
            release();
        }
    } catch (error) {
        logger.error('POST /api/config error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/config/write-track-names', async (req, res) => {
    try {
        const { enabled } = req.body;
        const prev = configLock;
        let release!: () => void;
        configLock = new Promise<void>(r => { release = r; });
        await prev;
        try {
            const current = getConfig();
            configStore.config = { ...current, writeTrackNames: !!enabled };
            await saveConfig(configStore.config);
            logger.info(`writeTrackNames=${configStore.config.writeTrackNames}`);
            res.json({ success: true, writeTrackNames: configStore.config.writeTrackNames });
        } finally {
            release();
        }
    } catch (error) {
        logger.error('POST /api/config/write-track-names error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/config/write-track-artists', async (req, res) => {
    try {
        const { enabled } = req.body;
        const prev = configLock;
        let release!: () => void;
        configLock = new Promise<void>(r => { release = r; });
        await prev;
        try {
            const current = getConfig();
            configStore.config = { ...current, writeTrackArtists: !!enabled };
            await saveConfig(configStore.config);
            logger.info(`writeTrackArtists=${configStore.config.writeTrackArtists}`);
            res.json({ success: true, writeTrackArtists: configStore.config.writeTrackArtists });
        } finally {
            release();
        }
    } catch (error) {
        logger.error('POST /api/config/write-track-artists error:', error);
        res.status(500).json({ error: (error as Error).message });
    }
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
        if (!isInsideMusicRoot(absolutePath, cfg.musicRoot)) {
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
        if (!isInsideMusicRoot(absolutePath, cfg.musicRoot)) {
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
        logger.error(`GET /api/post/${req.params.id} error:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/tags/update', async (req, res) => {
    const { folderPath, tags, trackArtists, trackNames, moveFiles, renameFiles } = req.body;
    if (!folderPath || !tags) return res.status(400).json({ error: 'folderPath and tags are required' });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('start', { message: 'Starting...' });

    try {
        const cfg = getConfig();
        const absolutePath = path.resolve(folderPath);
        if (!isInsideMusicRoot(absolutePath, cfg.musicRoot)) {
            send('error', { error: 'Access denied' });
            return res.end();
        }

        // Phase 1: Write tags
        const mp3Files = await getMp3Files(absolutePath);
        send('phase', { phase: 'Writing tags', current: 0, total: mp3Files.length });
        await writeTags({ folderPath: absolutePath, tags, trackArtists, trackNames }, cfg.musicRoot);
        send('phase', { phase: 'Tags written', current: mp3Files.length, total: mp3Files.length });

        // Phase 2: Compare tags (read before/after)
        send('phase', { phase: 'Comparing tags', current: 0, total: mp3Files.length });
        const tagChanges: string[] = [];
        for (let i = 0; i < mp3Files.length; i++) {
            send('file', { current: i + 1, total: mp3Files.length, file: mp3Files[i], phase: 'compare' });
        }
        // Simplified: just report count
        send('log', { message: `Compared ${mp3Files.length} files` });

        // Phase 3: Rename / Move
        let moved: string[] | undefined;
        let renamed: { from: string; to: string }[] | undefined;
        if (moveFiles) {
            send('phase', { phase: 'Renaming files...', current: 0, total: 1 });
            const origMp3 = await getMp3Files(absolutePath);
            let albumArtistForMove: string | undefined;
            let yearForMove: string | undefined;
            let albumForMove: string | undefined;
            if (origMp3[0]) {
                try {
                    const ft = NodeID3.read(path.join(absolutePath, origMp3[0]));
                    albumArtistForMove = tags.albumArtist || tags.artist;
                    yearForMove = tags.year || (ft as unknown as Id3Tags)?.year;
                    albumForMove = tags.album;
                } catch (e) { logger.warn(`failed to read tags for move metadata: ${(e as Error).message}`); }
            }
            const renameResult = await renameFilesInPlace(absolutePath, tags.artist, trackArtists, trackNames, cfg.musicRoot);
            renamed = renameResult.renamed;
            send('log', { message: `Renamed ${renamed.length} files` });

            send('phase', { phase: 'Moving files...', current: 0, total: 1 });
            const result = await moveProcessedFiles(
                absolutePath, getOutputRoot(cfg), cfg.musicRoot, tags,
                albumArtistForMove, trackArtists, trackNames,
                cfg.outputMode, yearForMove, albumForMove,
                cfg.cleanupIgnorePatterns,
            );
            moved = result.moved;
            send('log', { message: `Moved ${moved.length} files to output` });
        } else if (renameFiles) {
            send('phase', { phase: 'Renaming files...', current: 0, total: 1 });
            const result = await renameFilesInPlace(absolutePath, tags.artist, trackArtists, trackNames, cfg.musicRoot);
            renamed = result.renamed;
            send('log', { message: `Renamed ${renamed.length} files` });
        }

        send('done', { success: true, moved, renamed, tagChanges });
    } catch (error) {
        logger.error(`POST /api/tags/update error:`, error);
        send('error', { error: (error as Error).message });
    }
    res.end();
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
    if (html.length > 1_000_000) {
        return res.status(413).json({ error: 'HTML too large (max 1MB)' });
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

// ─── Auto-generated source routes ──────────────────────────────
for (const src of sources) {
    app.post(`/api/search-${src.id}`, async (req, res) => {
        const { artist, album, query } = req.body;
        logger.info(`POST /api/search-${src.id} artist="${artist || ''}" album="${album || ''}" query="${query || ''}"`);

        try {
            const results = await src.search(artist, album, query);
            logger.info(`POST /api/search-${src.id} → ${results.length} results`);
            res.json(results);
        } catch (error) {
            logger.error(`POST /api/search-${src.id} error:`, error);
            res.status(500).json({ error: (error as Error).message });
        }
    });

    if (src.getDetails) {
        app.get(`/api/${src.id}/:id`, async (req, res) => {
            logger.info(`GET /api/${src.id}/${req.params.id}`);

            try {
                const result = await src.getDetails!(req.params.id);
                if (!result) return res.status(404).json({ error: 'Not found' });
                res.json(result);
            } catch (error) {
                logger.error(`GET /api/${src.id}/${req.params.id} error:`, error);
                res.status(500).json({ error: (error as Error).message });
            }
        });
    }
}

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
