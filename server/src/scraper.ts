import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

(puppeteer as any).use(StealthPlugin());

async function findRunningBrowserWs(): Promise<string | null> {
    try {
        const portFile = path.join('./user_data', 'DevToolsActivePort');
        if (fsSync.existsSync(portFile)) {
            const content = fsSync.readFileSync(portFile, 'utf-8').trim();
            const lines = content.split('\n');
            if (lines.length >= 2) {
                const port = lines[0];
                return `ws://127.0.0.1:${port}${lines[1]}`;
            }
        }
    } catch (e) { logger.debug(`findRunningBrowserWs: ${(e as Error).message}`); return null; }
    return null;
}

// ── Interfaces ──────────────────────────────────────────────

export interface SearchResult {
    source: string;
    id: string;
    postId: number;
    bandId: number | null;
    albumName: string | null;
    artist: string;
    albumArtist: string;
    coverUrl: string | null;
    country: string | null;
    year: string | null;
    label: string | null;
    genres: string[];
    genreIds?: number[];
    releaseType: string | null;
    typeId?: number | null;
    url: string;
    tracklist?: string;
    notes?: string;
    youtube?: string;
    metalArchivesUrl?: string;
    artworkBy?: string;
    compilation?: boolean;
    parsedTracks?: { num: string; artist: string; name: string }[];
    trackCount?: number;
    extraTags?: Record<string, string>;
    musicbrainzReleaseId?: string | null;
    musicbrainzArtistId?: string | null;
    musicbrainzReleaseGroupId?: string | null;
    catalogNumber?: string | null;
    discId?: string | null;
    originalYear?: string | null;
}

// ── Dynamic genre/type/country mapping ────────────────────────

let genreMap: Record<number, string> = {};
let typeMap: Record<number, string> = {};
let taxonomyLoaded = false;

const TAXONOMY_CACHE_FILE = path.join(__dirname, '../taxonomy-cache.json');
const TAXONOMY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface TaxonomyCache {
    updatedAt: number;
    genres: Record<number, string>;
    types: Record<number, string>;
}

async function loadTaxonomyFromFile(): Promise<boolean> {
    try {
        const data = await fs.readFile(TAXONOMY_CACHE_FILE, 'utf-8');
        const cache: TaxonomyCache = JSON.parse(data);
        if (cache.genres && cache.types && Date.now() - cache.updatedAt < TAXONOMY_MAX_AGE_MS) {
            genreMap = cache.genres;
            typeMap = cache.types;
            taxonomyLoaded = true;
            const ageDays = Math.floor((Date.now() - cache.updatedAt) / (24 * 60 * 60 * 1000));
            logger.info(`loaded from cache (${ageDays}d old): ${Object.keys(genreMap).length} genres, ${Object.keys(typeMap).length} types`);
            return true;
        }
        logger.info('cache expired, will refresh');
    } catch (e) { logger.info(`loadTaxonomyFromFile: ${(e as Error).message}`); }
    return false;
}

async function saveTaxonomyToFile() {
    try {
        const cache: TaxonomyCache = { updatedAt: Date.now(), genres: genreMap, types: typeMap };
        await fs.writeFile(TAXONOMY_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
        logger.info('saved to file');
    } catch (e) {
        logger.error('failed to save cache:', (e as Error).message);
    }
}

async function fetchTaxonomyFromDGC(): Promise<boolean> {
    try {
        const p = await ensureBrowser();
        const html = await p.evaluate(async () => {
            const res = await fetch('https://deathgrind.club', { credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        });
        const jsMatch = html.match(/href='\/static\/dist\/release-type\.[^']+'/);
        if (!jsMatch) { logger.error('release-type JS not found in DGC HTML'); return false; }
        const jsPath = jsMatch[0].match(/href='([^']+)'/)?.[1];
        if (!jsPath) return false;
        const jsText = await p.evaluate(async (url: string) => {
            const res = await fetch(`https://deathgrind.club${url}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        }, jsPath);
        const extractPairs = (obj: string): Record<number, string> => {
            const pairs: Record<number, string> = {};
            const pairRegex = /(\d+):`([^`]+)`/g;
            let m: RegExpExecArray | null;
            while ((m = pairRegex.exec(obj)) !== null) {
                if (m[2]) pairs[Number(m[1])] = m[2];
            }
            return pairs;
        };
        const extractBlock = (js: string, varName: string): string => {
            const start = js.indexOf(`${varName}={`);
            if (start === -1) return '';
            const depthStart = start + varName.length + 1;
            let depth = 0;
            for (let i = depthStart; i < js.length; i++) {
                if (js[i] === '{') depth++;
                else if (js[i] === '}') { depth--; if (depth === 0) return js.slice(depthStart, i + 1); }
            }
            return js.slice(depthStart);
        };
        const newGenres = extractPairs(extractBlock(jsText, 't'));
        const newTypes = extractPairs(extractBlock(jsText, 'i'));
        if (Object.keys(newGenres).length === 0 || Object.keys(newTypes).length === 0) {
            logger.error('empty maps from DGC JS');
            return false;
        }
        genreMap = newGenres;
        typeMap = newTypes;
        return true;
    } catch (e) {
        logger.error('failed to fetch taxonomy from DGC:', (e as Error).message);
        return false;
    }
}

export async function ensureTaxonomy(): Promise<void> {
    if (taxonomyLoaded) return;
    const fromFile = await loadTaxonomyFromFile();
    if (fromFile) return;
    const ok = await fetchTaxonomyFromDGC();
    if (ok) {
        taxonomyLoaded = true;
        await saveTaxonomyToFile();
        logger.info(`loaded from DGC: ${Object.keys(genreMap).length} genres, ${Object.keys(typeMap).length} types`);
    } else if (Object.keys(genreMap).length > 0) {
        taxonomyLoaded = true;
        logger.info('fetch failed, using stale data');
    } else {
        taxonomyLoaded = true;
        logger.warn('taxonomy unavailable: fetch failed and no cached data');
    }
}

function resolveGenreName(id: number): string {
    return genreMap[id] || String(id);
}

function resolveTypeName(id: number): string {
    return typeMap[id] || String(id);
}

interface DgcPost {
    postId: number;
    title: string;
    bands: { name: string; bandId: number }[];
    album: string;
    country: string[];
    genre: number[];
    label: { name: string; labelId: number }[];
    releaseDate: number[];
    type: number[];
    attachments: { file: string; thumb: string }[];
    tracklist?: string;
    notes?: string;
    youtube?: string;
    relatedLinks?: { url: string; title: string }[];
    artworkBy?: string;
}

// ── Browser lifecycle (persistent) ──────────────────────────

let browser: any = null;
let page: any = null;
let managedBrowser = false;
let browserLaunchPromise: Promise<any> | null = null;

async function launchBrowser(): Promise<any> {
    logger.info('launching browser...');
    try {
        const launched = await (puppeteer as any).launch({
            headless: process.env.NODE_ENV === 'production' || process.env.HEADLESS === 'true',
            defaultViewport: null,
            pipe: false,
            userDataDir: './user_data',
            args: [
                '--window-size=900,700',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
        });

        browser = launched;
        managedBrowser = true;
        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();
        await page.goto('https://deathgrind.club', { waitUntil: 'domcontentloaded', timeout: 60000 });
        logger.info('browser ready — if Cloudflare challenge appears, solve it in the browser window');
        return browser;
    } catch (err: any) {
        if (err.message?.includes('already running')) {
            logger.info('browser already running, attempting to connect...');
            const wsEndpoint = await findRunningBrowserWs();
            if (wsEndpoint) {
                const connected = await (puppeteer as any).connect({ browserWSEndpoint: wsEndpoint });
                browser = connected;
                managedBrowser = false;
                const pages = await browser.pages();
                page = pages[0] || await browser.newPage();
                logger.info('connected to existing browser');
                return browser;
            }
        }
        throw err;
    }
}

export async function ensureBrowser() {
    if (browser && page) {
        try {
            await page.bringToFront();
            return page;
        } catch {
            browser = null;
            page = null;
        }
    }

    // Если уже запускаем браузер — ждём существующий промис
    if (browserLaunchPromise) {
        logger.info('waiting for existing browser launch...');
        browser = await browserLaunchPromise;
        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();
        return page;
    }

    // Запускаем браузер в фоне — сразу сохраняем промис
    browserLaunchPromise = launchBrowser();

    try {
        const launched = await browserLaunchPromise;
        if (launched) browser = launched;
    } finally {
        browserLaunchPromise = null;
    }

    if (!browser) throw new Error('Browser disconnected during launch');

    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();

    // Не убиваем браузер при SIGINT/SIGTERM — оставляем жить
    browser.on('disconnected', () => {
        logger.warn('browser disconnected');
        managedBrowser = false;
        browser = null;
        page = null;
        browserLaunchPromise = null;
    });

    return page;
}

// ── API helpers ─────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
    const p = await ensureBrowser();
    const url = `https://deathgrind.club${path}`;
    logger.info(`fetch ${url}`);
    try {
        const result = await p.evaluate(async (fetchUrl: string) => {
            const res = await fetch(fetchUrl, { credentials: 'include' });
            if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
            return res.json();
        }, url);
        logger.info(`OK ${url} → ${JSON.stringify(result).slice(0, 150)}`);
        return result as T;
    } catch (err) {
        logger.error(`fetch failed for ${url}: ${(err as Error).message}`);
        try { await p.reload({ waitUntil: 'domcontentloaded' }); } catch (e) { logger.warn(`browser reload failed: ${(e as Error).message}`); }
        throw err;
    }
}

function mapCountry(codes: string[]): string | null {
    if (!codes || codes.length === 0) return null;
    return codes.map(c => COUNTRY_MAP[c] || c).join(' / ');
}

const COUNTRY_MAP: Record<string, string> = {
    AD: 'Andorra', AE: 'United Arab Emirates', AF: 'Afghanistan', AG: 'Antigua and Barbuda',
    AL: 'Albania', AM: 'Armenia', AO: 'Angola', AR: 'Argentina', AT: 'Austria', AU: 'Australia',
    AZ: 'Azerbaijan', BA: 'Bosnia and Herzegovina', BB: 'Barbados', BD: 'Bangladesh', BE: 'Belgium',
    BF: 'Burkina Faso', BG: 'Bulgaria', BH: 'Bahrain', BI: 'Burundi', BJ: 'Benin', BN: 'Brunei',
    BO: 'Bolivia', BR: 'Brazil', BS: 'Bahamas', BT: 'Bhutan', BW: 'Botswana', BY: 'Belarus',
    BZ: 'Belize', CA: 'Canada', CD: 'Democratic Republic of the Congo', CF: 'Central African Republic',
    CG: 'Congo', CH: 'Switzerland', CI: 'Ivory Coast', CL: 'Chile', CM: 'Cameroon', CN: 'China',
    CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba', CY: 'Cyprus', CZ: 'Czech Republic',
    DE: 'Germany', DJ: 'Djibouti', DK: 'Denmark', DM: 'Dominica', DO: 'Dominican Republic',
    DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', ER: 'Eritrea', ES: 'Spain',
    ET: 'Ethiopia', FI: 'Finland', FJ: 'Fiji', FM: 'Micronesia', FR: 'France', GA: 'Gabon',
    GB: 'United Kingdom', GD: 'Grenada', GE: 'Georgia', GH: 'Ghana', GM: 'Gambia', GN: 'Guinea',
    GQ: 'Equatorial Guinea', GR: 'Greece', GT: 'Guatemala', GW: 'Guinea-Bissau', GY: 'Guyana',
    HK: 'Hong Kong', HN: 'Honduras', HR: 'Croatia', HT: 'Haiti', HU: 'Hungary', ID: 'Indonesia',
    IE: 'Ireland', IL: 'Israel', IN: 'India', IQ: 'Iraq', IR: 'Iran', IS: 'Iceland', IT: 'Italy',
    JM: 'Jamaica', JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan', KH: 'Cambodia',
    KM: 'Comoros', KN: 'Saint Kitts and Nevis', KP: 'North Korea', KR: 'South Korea', KW: 'Kuwait',
    KZ: 'Kazakhstan', LA: 'Laos', LB: 'Lebanon', LC: 'Saint Lucia', LI: 'Liechtenstein',
    LK: 'Sri Lanka', LR: 'Liberia', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
    MA: 'Morocco', MD: 'Moldova', ME: 'Montenegro', MG: 'Madagascar', MK: 'North Macedonia',
    ML: 'Mali', MM: 'Myanmar', MN: 'Mongolia', MO: 'Macao', MR: 'Mauritania', MT: 'Malta',
    MU: 'Mauritius', MV: 'Maldives', MW: 'Malawi', MX: 'Mexico', MY: 'Malaysia', MZ: 'Mozambique',
    NA: 'Namibia', NE: 'Niger', NG: 'Nigeria', NI: 'Nicaragua', NL: 'Netherlands', NO: 'Norway',
    NP: 'Nepal', NR: 'Nauru', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama', PE: 'Peru',
    PG: 'Papua New Guinea', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland', PT: 'Portugal',
    PY: 'Paraguay', QA: 'Qatar', RO: 'Romania', RS: 'Serbia', RU: 'Russia', RW: 'Rwanda',
    SA: 'Saudi Arabia', SB: 'Solomon Islands', SC: 'Seychelles', SD: 'Sudan', SE: 'Sweden',
    SG: 'Singapore', SI: 'Slovenia', SK: 'Slovakia', SL: 'Sierra Leone', SN: 'Senegal',
    SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan', SV: 'El Salvador', SY: 'Syria',
    SZ: 'Eswatini', TD: 'Chad', TG: 'Togo', TH: 'Thailand', TJ: 'Tajikistan', TM: 'Turkmenistan',
    TN: 'Tunisia', TO: 'Tonga', TR: 'Turkey', TT: 'Trinidad and Tobago', TW: 'Taiwan',
    TZ: 'Tanzania', UA: 'Ukraine', UG: 'Uganda', US: 'United States', UY: 'Uruguay',
    UZ: 'Uzbekistan', VE: 'Venezuela', VN: 'Vietnam', VU: 'Vanuatu', WS: 'Samoa',
    XK: 'Kosovo', YE: 'Yemen', ZA: 'South Africa', ZM: 'Zambia', ZW: 'Zimbabwe',
};

function mapPost(post: DgcPost, genresRaw: number[] | undefined, typeRaw: number[] | undefined): SearchResult {
    const bands = post.bands || [];
    const artist = bands.length > 1
        ? bands.map(b => b.name).join(' / ')
        : (bands[0]?.name || 'Unknown');
    const coverUrl = post.attachments?.[0]?.file
        ? `https://cdn.deathgrind.club/s/${post.attachments[0].file}`
        : null;
    const country = mapCountry(post.country);
    const rawYear = post.releaseDate?.[0];
    const year = (rawYear != null && rawYear >= 1900 && rawYear <= 2099) ? String(rawYear) : null;
    const label = post.label?.[0]?.name || null;

    return {
        source: 'dgc',
        id: String(post.postId),
        postId: post.postId,
        bandId: bands[0]?.bandId ?? null,
        albumName: post.album || null,
        artist,
        albumArtist: artist,
        coverUrl,
        country,
        year,
        label,
        genres: (genresRaw || []).map(resolveGenreName),
        genreIds: post.genre || [],
        releaseType: typeRaw?.[0] != null ? resolveTypeName(typeRaw[0]) : null,
        typeId: post.type?.[0] ?? null,
        url: `https://deathgrind.club/posts/${post.postId}`,
    };
}

// ── Public API ──────────────────────────────────────────────

export async function searchAlbums(query: string): Promise<SearchResult[]> {
    logger.info(`searchAlbums("${query}")`);
    await ensureTaxonomy();

    const data = await apiFetch<{ posts: DgcPost[] }>(
        `/api/posts/search?q=${encodeURIComponent(query)}`
    );
    const results = (data.posts || []).map(p => mapPost(p, p.genre, p.type));
    logger.info(`searchAlbums → ${results.length} results`);

    return results;
}

export async function getAlbumDetails(postId: number): Promise<SearchResult | null> {
    logger.info(`getAlbumDetails(${postId})`);
    await ensureTaxonomy();

    const data = await apiFetch<{ post: DgcPost }>(`/api/posts/${postId}`);
    if (!data.post) return null;
    const result = mapPost(data.post, data.post.genre, data.post.type);
    if (data.post.tracklist) {
        result.tracklist = data.post.tracklist;
        const albumArtist = result.artist;
        const bandNames = (data.post.bands || []).map(b => b.name.toLowerCase());
        const isCompilation = bandNames.length === 1 && (bandNames[0] === 'va' || bandNames[0] === 'various artists');
        result.compilation = isCompilation;
        let currentSectionArtist: string | null = null;
        let lastKnownBandIndex = -1;
        const lines = data.post.tracklist.split('\n');
        const parsedTracks: { num: string; artist: string; name: string }[] = [];

        logger.debug(`parsing tracklist for post ${postId}: bands=[${bandNames.join(', ')}], albumArtist="${albumArtist}"`);
        logger.debug(`raw tracklist:\n${data.post.tracklist}`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const trimmed = line.trim();
            if (!trimmed) continue;

            const trackMatch = trimmed.match(/^(\d{1,3})[.\s)]+\s*(.+)/);
            if (trackMatch && trackMatch[1] && trackMatch[2]) {
                const num = trackMatch[1];
                const rest = trackMatch[2].trim();
                const dashIdx = rest.search(/\s[-–—]\s/);
                if (isCompilation && dashIdx > 0) {
                    const beforeDash = rest.slice(0, dashIdx).trim();
                    const afterDash = rest.slice(dashIdx + 1).replace(/^[-–—]\s*/, '').trim();
                    parsedTracks.push({ num, artist: beforeDash, name: afterDash });
                    logger.debug(`  track ${num}: artist="${beforeDash}" name="${afterDash}" (compilation)`);
                } else if (dashIdx > 0) {
                    const beforeDash = rest.slice(0, dashIdx).trim();
                    const afterDash = rest.slice(dashIdx + 1).replace(/^[-–—]\s*/, '').trim();
                    const isKnownArtist = bandNames.includes(beforeDash.toLowerCase()) ||
                        beforeDash.toLowerCase() === albumArtist.toLowerCase() ||
                        (currentSectionArtist && beforeDash.toLowerCase() === currentSectionArtist.toLowerCase());
                    if (isKnownArtist) {
                        parsedTracks.push({ num, artist: beforeDash, name: afterDash });
                        logger.debug(`  track ${num}: artist="${beforeDash}" name="${afterDash}" (matched band)`);
                    } else {
                        let effectiveArtist = currentSectionArtist;
                        if (!effectiveArtist || i <= lastKnownBandIndex) {
                            effectiveArtist = null;
                        }
                        parsedTracks.push({ num, artist: effectiveArtist || albumArtist, name: rest });
                        logger.debug(`  track ${num}: artist="${effectiveArtist || albumArtist}" name="${rest}" (fallback, section="${currentSectionArtist}", lastBandIdx=${lastKnownBandIndex}, lineIdx=${i})`);
                    }
                } else {
                    let effectiveArtist = currentSectionArtist;
                    if (!effectiveArtist || i <= lastKnownBandIndex) {
                        effectiveArtist = null;
                    }
                    parsedTracks.push({ num, artist: effectiveArtist || albumArtist, name: rest });
                    logger.debug(`  track ${num}: artist="${effectiveArtist || albumArtist}" name="${rest}" (no dash)`);
                }
            } else {
                const cleanName = trimmed.replace(/[:]+$/, '').trim();
                if (cleanName && !cleanName.match(/^\d/)) {
                    currentSectionArtist = cleanName;
                    lastKnownBandIndex = i;
                    logger.debug(`  section header: artist="${cleanName}" at line ${i}`);
                }
            }
        }
        logger.info(`parsed ${parsedTracks.length} tracks`);
        result.parsedTracks = parsedTracks;
    }
    if (data.post.notes) result.notes = data.post.notes;
    if (data.post.youtube) result.youtube = data.post.youtube;
    if (data.post.artworkBy) result.artworkBy = data.post.artworkBy;
    const maLink = data.post.relatedLinks?.find(l => l.title?.toLowerCase().includes('metal archives'));
    if (maLink?.url) result.metalArchivesUrl = maLink.url;

    return result;
}

export async function parseGenresFromPage(html: string): Promise<{ genres: string[]; types: string[] }> {
    logger.info('parsing genres/types from page HTML');
    const genres: string[] = [];
    const types: string[] = [];

    // Ищем жанры в span с классом genre или data-genre
    const genreRegex = /(?:genre|Genre)[^>]*>([^<]+)/gi;
    let match;
    while ((match = genreRegex.exec(html)) !== null) {
        const g = match[1]?.trim();
        if (g && !genres.includes(g)) genres.push(g);
    }

    // Ищем type/release type
    const typeRegex = /(?:type|Type|Release\s*Type)[^>]*>([^<]+)/gi;
    while ((match = typeRegex.exec(html)) !== null) {
        const t = match[1]?.trim();
        if (t && !types.includes(t)) types.push(t);
    }

    // Fallback: ищем в JSON-данных, если они есть на странице
    const jsonMatch = html.match(/"genre":\s*\[(.*?)\]/);
    if (jsonMatch) {
        const names = html.match(/"name":"([^"]+)"/g);
        if (names) {
            for (const n of names) {
                const name = n.replace(/"name":"/, '').replace(/"/g, '');
                if (name && !genres.includes(name)) genres.push(name);
            }
        }
    }

    logger.info(`parsed: ${genres.length} genres, ${types.length} types`);
    return { genres, types };
}

export async function fetchPageContent(url: string): Promise<string> {
    logger.info(`fetchPageContent(${url})`);
    const p = await ensureBrowser();

    const html = await p.evaluate(async (fetchUrl: string) => {
        const res = await fetch(fetchUrl, { credentials: 'include', redirect: 'manual' });
        if (res.type === 'opaqueredirect') {
            throw new Error('Redirect blocked');
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.text();
    }, url);

    const injectedHtml = html.replace(
        '</head>',
        `<base href="${url}" />
        <style>
          body { background: #000 !important; color: #f4f4f5 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          a { color: #ef4444 !important; }
          img { max-width: 100%; height: auto; }
        </style>
        </head>`
    );

    return injectedHtml;
}

export interface DiscographyAlbum {
    postId: number;
    bandId: number;
    album: string | null;
    artist: string;
    year: string | null;
    genres: string[];
    label: string | null;
    releaseType: string | null;
    coverUrl: string | null;
}

export interface DiscographyResult {
    bandId: number;
    bandName: string;
    albums: DiscographyAlbum[];
}

export async function getBandDiscography(bandId: number): Promise<DiscographyResult | null> {
    logger.info(`getBandDiscography(${bandId})`);
    await ensureTaxonomy();

    const allPosts: DgcPost[] = [];
    let offset = 0;
    let hasMore = true;
    let bandName = '';

    while (hasMore) {
        const data = await apiFetch<{ band: { name: string; discography: { posts: DgcPost[]; hasMore: boolean; offset: number } } }>(
            `/api/bands/${bandId}?offset=${offset}`
        );
        if (!data.band) return null;
        bandName = data.band.name;
        allPosts.push(...(data.band.discography?.posts || []));
        hasMore = data.band.discography?.hasMore ?? false;
        offset = data.band.discography?.offset ?? offset + 1;
        if (hasMore) await new Promise(r => setTimeout(r, 1500));
    }

    logger.info(`getBandDiscography(${bandId}) → ${allPosts.length} albums`);

    return {
        bandId,
        bandName,
        albums: allPosts.map(p => {
            const sr = mapPost(p, p.genre, p.type);
            return {
                postId: p.postId,
                bandId,
                album: sr.albumName,
                artist: sr.artist,
                year: sr.year,
                genres: sr.genres,
                label: sr.label,
                releaseType: sr.releaseType,
                coverUrl: sr.coverUrl,
            };
        }),
    };
}

export function getBrowserStatus(): { connected: boolean; hasPage: boolean } {
    return { connected: !!browser, hasPage: !!page };
}
