# DGC Tagger

Desktop app for batch-tagging MP3 files from [Deathgrind Club](https://deathgrind.club), [Deezer](https://deezer.com), [MusicBrainz](https://musicbrainz.org), and [Bandcamp](https://bandcamp.com).

## Quick Start

```bash
npm install
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev` | tsx watch + Vite middleware, one port |
| `npm run build` | Build client (`cd client && npm run build`) |
| `npm start` | Production mode (`NODE_ENV=production`) |

## Features

- **4 search sources** — DGC (red), Deezer (green), MusicBrainz (orange), Bandcamp (teal) in parallel
- **Plugin architecture** — add new sources with 1 file + 1 line in registry
- **Compilation mode** — auto-detect VA compilations, per-track artist parsing
- **Local tags editing** — edit tags without search results
- **Batch tag writing** — write ID3 tags, rename files, move to output folder
- **Track matching** — prefix/contains matching for files like "Track (Cover)"
- **Tag preservation** — IDs preserved across source switches
- **Extra Tags panel** — editable extra tags with "Clear all" to remove from file
- **Progress overlay** — shows operation result (moved/renamed files)
- **Puppeteer integration** — persistent browser, Cloudflare bypass
- **Resizable panels** — drag borders to resize library tree / matches / main panel (positions saved to localStorage)
- **Source toggles** — enable/disable search sources in Settings
- **Tree badges** — nested dir count; audio file count on selected folder

## Architecture

- **Single process** — Express + Vite middleware, one port
- **Dev mode** — `NODE_ENV !== 'production'` → tsx watch + Vite `middlewareMode: true`
- **Prod mode** — Express serves `client/dist` as static
- **Plugin sources** — `server/src/sources/` with `SearchSource` interface
- **Unified SearchResult** — all sources normalize to common type
- **Data-driven tags** — `writeUserDefinedText(current, Record<string, string | undefined>)`
- **Config mutex** — promise-chain lock prevents concurrent config corruption
- **npm workspaces** — hoisted to root

## Configuration

- `server/config.default.json` — defaults (in git)
- `server/config.json` — user settings (in .gitignore)
- `enabledSources` — which search sources are active (persisted)

## Project Structure

```
server/src/
├── index.ts          — Express API routes + Vite middleware
├── sources/          — plugin architecture
│   ├── types.ts      — SearchSource interface
│   ├── index.ts      — registry sources[] + getSource(id)
│   ├── dgc.ts        — wrapper over scraper.ts
│   ├── deezer.ts     — wrapper over deezer.ts
│   ├── musicbrainz.ts — wrapper over musicbrainz.ts
│   └── bandcamp.ts   — wrapper over bandcamp.ts
├── scraper.ts        — puppeteer + stealth, DGC API
├── bandcamp.ts       — Bandcamp search + JSON-LD album parser
├── deezer.ts         — Deezer API (axios) with rate limiting
├── musicbrainz.ts    — MusicBrainz API + Lucene escaping
├── tagWriter.ts      — ID3 writing (data-driven writeUserDefinedText)
├── tagger.ts         — ID3 reading + music-metadata for duration (single pass)
├── scanner.ts        — filesystem traversal (async, lazy + recursive)
├── config.ts         — config.json load/save + enabledSources
├── cache.ts          — file cache for bands/releases
├── logger.ts         — leveled logger (debug/info/warn/error)
└── trackUtils.ts     — track number extraction, getMp3Files, path validation

client/src/
├── main.tsx
├── App.tsx           — layout + resizable panels + localStorage persistence
├── api.ts            — axios + interceptors, simple POST for tag updates
├── types.ts          — SearchResult, AlbumTags, MatchResult, etc.
├── sourceConfigs.ts  — [{ id, label, color }]
├── index.css         — CSS variables + hover utility classes
├── hooks/
│   ├── useAppContext.tsx — reducer + composition (useMemo context)
│   ├── appReducer.ts     — state, actions, reducer
│   ├── useSearch.ts      — search + select handlers (4 sources)
│   ├── useLibrary.ts     — library + folder select
│   ├── useConfig.ts      — config + cache + enabledSources
│   ├── useTagActions.ts  — applyTags with simple POST
│   └── useWebfetch.ts    — webfetch overlay (AbortController)
├── utils/
│   ├── index.ts          — stripParentheses, generateParsedTracks
│   ├── similarity.ts     — Levenshtein distance
│   └── trackMatching.ts  — matchTracks, parseCompilationTracklist
└── components/
    ├── styles.ts             — COLORS, FONT, FS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL
    ├── ResultCard.tsx        — 2-line card (cover + artist/year/album/label, lazy images)
    ├── SearchResults.tsx     — vertical list of 4 source results
    ├── TagComparison.tsx     — file vs catalog tags + Extra Tags (editable)
    ├── TrackMatcher.tsx      — track matching panel (useMemo, batch toggles)
    ├── MatchRow.tsx          — single track row (ERR for unknown duration, -:-- for remote)
    ├── SingleArtistTracks.tsx
    ├── MultiArtistTracks.tsx
    ├── TrackArtistField.tsx  — inline artist edit (synced with prop)
    ├── ApplyPanel.tsx        — WRITE & MOVE / RENAME / WRITE / CANCEL
    ├── ProgressOverlay.tsx   — operation result with auto-scroll log
    ├── ResultModal.tsx
    ├── SettingsModal.tsx     — sources toggles + tag defaults
    ├── WebfetchOverlay.tsx   — sandboxed iframe
    ├── LibraryTree.tsx       — tree with dir count badges (useMemo counts)
    ├── SearchBar.tsx
    ├── ErrorBoundary.tsx
    └── Footer.tsx
```

## Adding a New Source

1. Create `server/src/sources/my-source.ts`:

```typescript
import type { SearchSource } from './types.js';
export const mySource: SearchSource = {
  id: 'mysource',
  label: 'My Source',
  accentColor: '#aabbcc',
  async search(artist, album, query) { return fetchFromApi(artist, album); },
  async getDetails(id) { return fetchDetails(id); },  // optional
};
```

2. Register in `server/src/sources/index.ts`:

```typescript
import { mySource } from './my-source.js';
export const sources = [..., mySource];
```

3. Add to `client/src/sourceConfigs.ts`:

```typescript
{ id: 'mysource', label: 'MY SOURCE', color: '#aabbcc' },
```

Routes auto-generated: `POST /api/search-mysource`, `GET /api/mysource/:id`

### Current Sources

| ID | Label | Color | Search | Details |
|----|-------|-------|--------|---------|
| `dgc` | DGC | `#ef4444` | ✅ | ✅ `/api/post/:id` |
| `deezer` | Deezer | `#4ade80` | ✅ | — |
| `mbrainz` | MusicBrainz | `#f97316` | ✅ | ✅ `/api/mbrainz/:id` |
| `bandcamp` | Bandcamp | `#629aa9` | ✅ | ✅ JSON-LD parse |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Get config |
| POST | `/api/config` | Save config (mutex-protected) |
| POST | `/api/config/write-track-names` | Toggle track name writing |
| POST | `/api/config/write-track-artists` | Toggle track artist writing |
| GET | `/api/library` | Library tree |
| GET | `/api/library/children?dirPath=` | Lazy-load directory children |
| GET | `/api/tags?folderPath=` | AlbumTags from folder |
| POST | `/api/search` | DGC search (compatibility) |
| POST | `/api/search-{sourceId}` | Auto-generated source search |
| GET | `/api/{sourceId}/:id` | Auto-generated source details |
| GET | `/api/post/:id` | DGC post details |
| POST | `/api/tags/update` | Write tags + rename/move, returns JSON result |
| POST | `/api/cache/clear` | Clear cache |
| GET | `/api/webfetch?url=` | SSRF-protected page fetch (redirects blocked) |
| POST | `/api/parse-genres` | Parse genres from HTML (max 1MB) |
| GET | `/api/browser/status` | Puppeteer browser status |

### Tag Update Response (`POST /api/tags/update`)

```json
{
  "success": true,
  "moved": ["file1.mp3", "file2.mp3"],
  "renamed": [{"from": "old.mp3", "to": "01. Artist - Title.mp3"}]
}
```

## Tagging Pipeline

```
[1] tagger.ts — read tags from folder (single pass via music-metadata)
    ▼
[2] TagComparison.tsx — edit tags (file vs catalog + Extra Tags)
    ▼
[3] TrackMatcher.tsx — match tracks (prefix/contains)
    ▼
[4] ApplyPanel.tsx — WRITE & MOVE / RENAME / WRITE / CANCEL
    ▼
[5] tagWriter.ts — write (writeUserDefinedText data-driven)
    ▼
[6] ProgressOverlay.tsx — result summary
```

## Security

- **SSRF**: `/api/webfetch` — allowlist `deathgrind.club`, `cdn.deathgrind.club`, redirects blocked via `redirect: 'manual'`
- **Path traversal**: `isInsideMusicRoot()` — `path.sep`-aware prefix check (case-insensitive on Windows, case-sensitive on Linux)
- **XSS**: WebfetchOverlay iframe uses `sandbox=""`
- **DoS**: `/api/parse-genres` rejects bodies > 1MB
- **Config corruption**: mutex prevents concurrent writes
- **Headless mode configurable** (`NODE_ENV=production` or `HEADLESS=true`)

## Notes

- **Puppeteer** — persistent browser, `userDataDir` in `user_data/`, shared by DGC + Bandcamp
- **Cloudflare** — manual challenge on first run
- **Taxonomy** — genre/type from DGC JS, 7d TTL cache
- **MusicBrainz** — rate limit 1 req/sec, User-Agent required, Lucene query escaping
- **Deezer** — 120ms delay between album detail requests
- **Bandcamp** — search via Puppeteer (JS challenge), album details via JSON-LD
- **music-metadata** — single-pass duration detection, ERR shown for undetectable files
- **CSS hover** — utility classes (hover-bg, hover-toolbar, hover-red, hover-lift) replace JS event handlers

## Open TODOs

- [ ] Extend format support: FLAC, M4A, OGG (scanner detects them, tagger/writer don't)
- [ ] `isInsideMusicRoot` case sensitivity on Linux
- [ ] `parseFilename` regex edge cases with dotted track numbers
- [ ] `localeCompare` numeric sorting for file listing

## License

MIT
