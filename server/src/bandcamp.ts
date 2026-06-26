import { ensureBrowser } from './scraper.js';
import { logger } from './logger.js';
import type { SearchResult } from './scraper.js';

export async function searchBandcamp(artist: string, album: string, query?: string): Promise<SearchResult[]> {
    const searchQuery = query || [artist, album].filter(Boolean).join(' ');
    if (!searchQuery) return [];

    logger.info(`bandcamp search: "${searchQuery}"`);
    const page = await ensureBrowser();

    try {
        await page.goto(`https://bandcamp.com/search?q=${encodeURIComponent(searchQuery)}&item_type=a`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        // Wait for search results
        await page.waitForSelector('.result-info', { timeout: 10000 }).catch(() => {});

        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.searchresult');
            return Array.from(items).slice(0, 10).map((item) => {
                const heading = item.querySelector('.heading a') as HTMLAnchorElement;
                const url = heading?.href || '';
                const title = heading?.textContent?.trim() || '';

                const subhead = item.querySelector('.subhead');
                const artistEl = subhead?.querySelector('a');
                const artistName = artistEl?.textContent?.trim() || '';
                const artistUrl = artistEl?.href || '';

                const genreEl = item.querySelector('.genre');
                const genre = genreEl?.textContent?.trim() || '';

                const imgEl = item.querySelector('img') as HTMLImageElement;
                const coverUrl = imgEl?.src || null;

                // Parse Bandcamp URL to get label subdomain
                const bcMatch = url.match(/https?:\/\/([^.]+)\.bandcamp\.com/);
                const subdomain = bcMatch?.[1] || '';

                return {
                    title,
                    artist: artistName,
                    url,
                    artistUrl,
                    subdomain,
                    genre,
                    coverUrl,
                };
            });
        });

        logger.info(`bandcamp: ${results.length} results`);

        return results.map((r: { title: string; artist: string; url: string; subdomain: string; genre: string; coverUrl: string | null }) => ({
            source: 'bandcamp',
            id: r.url,
            postId: 0,
            albumName: r.title || null,
            artist: r.artist || r.subdomain,
            albumArtist: r.artist || r.subdomain,
            coverUrl: r.coverUrl,
            country: null,
            year: null,
            label: r.subdomain,
            genres: r.genre ? [r.genre] : [],
            releaseType: null,
            url: r.url,
        }));
    } catch (err) {
        logger.error(`bandcamp search error: ${(err as Error).message}`);
        return [];
    }
}

export async function getBandcampAlbum(url: string): Promise<SearchResult | null> {
    logger.info(`bandcamp getAlbum: ${url}`);
    const page = await ensureBrowser();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const data = await page.evaluate(() => {
            const scriptEl = document.querySelector('script[type="application/ld+json"]');
            if (!scriptEl) return null;
            try {
                return JSON.parse(scriptEl.textContent || '{}');
            } catch {
                return null;
            }
        });

        if (!data) return null;

        const artist = data.byArtist?.name || '';
        const albumName = data.name || '';
        const coverUrl = data.image || null;
        const label = data.recordLabel?.name || null;
        const dateStr = data.datePublished || '';
        const year = dateStr.match(/\d{4}/)?.[0] || null;
        const keywords = data.keywords || [];
        const description = data.description || '';
        const creditText = data.creditText || '';

        // Parse tracks from JSON-LD
        const trackList = data.track?.itemListElement || [];
        const parsedTracks = trackList.map((item: any, i: number) => {
            const t = item.item || {};
            const duration = t.duration || '';
            // Parse ISO 8601 duration: P00H03M36S → seconds
            const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const seconds = m ? ((parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0')) : undefined;

            return {
                num: String(item.position || i + 1),
                artist,
                name: t.name || '',
                duration: seconds,
            };
        });

        const bcUrl = url;
        const trackCount = parsedTracks.length;

        return {
            source: 'bandcamp',
            id: bcUrl,
            postId: 0,
            bandId: null,
            albumName,
            artist,
            albumArtist: artist,
            coverUrl,
            country: null,
            year,
            label,
            genres: keywords.slice(0, 5),
            releaseType: null,
            url: bcUrl,
            parsedTracks,
            trackCount,
            notes: description || creditText || undefined,
        };
    } catch (err) {
        logger.error(`bandcamp getAlbum error: ${(err as Error).message}`);
        return null;
    }
}
