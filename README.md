# DGC Tagger

Desktop app for batch-tagging MP3 files from [Deathgrind Club](https://deathgrind.club), [Deezer](https://deezer.com), [MusicBrainz](https://musicbrainz.org), and [Bandcamp](https://bandcamp.com).

## Quick Start

```bash
npm install
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run dev:server` | tsx watch server |
| `npm run dev:client` | Vite dev server (standalone) |
| `npm run dev` | tsx watch + Vite middleware in single process |
| `npm run build` | Build client (`cd client && npm run build`) |
| `npm start` | Production mode (`cross-env NODE_ENV=production tsx server/src/index.ts`) |

## Features

- **4 search sources** — DGC (red), Deezer (green), MusicBrainz (orange), Bandcamp (teal) in parallel
- **Plugin architecture** — add new sources with 1 file + 1 line in registry
- **Library** — card-based album grid with cover art, band grouping, alphabetical navigation, infinite scroll
- **Discography** — auto-populates band discography from DGC when tagging (with duplicate-safe pagination)
- **Compilation / multi-artist toggle** — auto-detects VA compilations, single checkbox to flatten or split tracks
- **Notes panel** — displays DGC album notes in the comparison view
- **Strip parentheses toggle** — globally strip parenthesized suffixes from track/album names
- **Library controls** — adjustable card size slider, minimum album count filter, genre cloud filtering
- **Cleanup ignore patterns** — configurable list of files to skip during cleanup (`.DS_Store`, `Thumbs.db`, etc.)
- **Cache clearing** — from Settings UI or `/api/cache/clear` endpoint
- **Track matching** — Levenshtein similarity (0–100%), number-first + fuzzy matching
- **Tag preservation** — IDs preserved across source switches
- **Extra Tags panel** — editable extra tags with "Clear all" to remove from file
- **Diff-style rename** — terminal diff output showing exactly what changed in filenames
- **Batch tag writing** — write ID3 tags, rename files, move to output folder
- **Progress overlay** — shows operation result (moved/renamed files)
- **Puppeteer integration** — persistent browser, Cloudflare bypass
- **Resizable panels** — drag borders to resize (positions saved to localStorage)
- **Source toggles** — enable/disable search sources in Settings
- **Tree badges** — nested dir count; audio file count on selected folder
- **File operations** — rename, move, delete files with tree refresh
- **Folder picker** — browse filesystem roots (drives on Windows), expand-to-path
- **Context menu** — right-click on files/folders for rename/move/delete

## Architecture

- **Single process** — Express + Vite middleware, one port
- **Dev mode** — `NODE_ENV !== 'production'` → tsx watch + Vite `middlewareMode: true`
- **Prod mode** — Express serves `client/dist` as static
- **Plugin sources** — `server/src/sources/` with `SearchSource` interface (wrappers over `server/src/{scraper,deezer,musicbrainz,bandcamp}.ts`)
- **Unified SearchResult** — all sources normalize to common type
- **Data-driven tags** — `writeUserDefinedText(current, Record<string, string | undefined>)`
- **Config mutex** — promise-chain lock prevents concurrent config corruption
- **Library** — filesystem-based (`library/{bandId}/{postId}/album.json` + covers)
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
├── scraper.ts        — puppeteer + stealth, DGC API, taxonomy, discography
├── bandcamp.ts       — Bandcamp search + JSON-LD album parser
├── deezer.ts         — Deezer API (axios) with rate limiting
├── musicbrainz.ts    — MusicBrainz API + Lucene escaping + extra tag extraction
├── tagWriter.ts      — ID3 writing, diff-style rename, folder move
├── tagger.ts         — ID3 reading + music-metadata for duration (single pass)
├── library.ts        — album JSON storage, cover download, discography population
├── scanner.ts        — filesystem traversal (async, lazy + recursive)
├── config.ts         — config.json load/save + enabledSources
├── cache.ts          — JSON file cache for bands/releases with TTL
├── logger.ts         — leveled logger (debug/info/warn/error)
├── trackUtils.ts     — track number extraction, getMp3Files, path validation
└── types.ts          — AlbumTags, Id3Tags interfaces

client/src/
├── main.tsx
├── App.tsx           — layout + resizable panels + library/main view toggle
├── api.ts            — axios + interceptors, all API functions
├── types.ts          — FileNode, AlbumTags, SearchResult, MatchResult, DeezerSearchResult
├── sourceConfigs.ts  — [{ id, label, color }]
├── build.ts          — build version constant
├── index.css         — CSS variables, hover utilities, library view styles
├── assets/           — static assets (currently unused)
├── hooks/
│   ├── useAppContext.tsx — context provider + reducer composition
│   ├── appReducer.ts     — state (49 fields), actions (60+), reducer
│   ├── useSearch.ts      — parallel search (4 sources), generation-based cancellation
│   ├── useLibrary.ts     — tree fetch, folder select (auto-search), file operations
│   ├── useConfig.ts      — config + cache + enabledSources
│   ├── useTagActions.ts  — build full tag payload, POST, progress overlay
│   └── useWebfetch.ts    — webfetch overlay (AbortController)
├── utils/
│   ├── index.ts          — stripParentheses, generateParsedTracks
│   ├── similarity.ts     — Levenshtein distance
│   └── trackMatching.ts  — matchTracks, parseCompilationTracklist, parseSingleArtistTracklist
└── components/
    ├── styles.ts             — COLORS, FONT, FS, ICON_BUTTON, OVERLAY_BACKDROP, MODAL_PANEL
    ├── ResultCard.tsx        — compact card with cover hover preview
    ├── SearchResults.tsx     — wrapper for 4 source lists with counters
    ├── DgcResults.tsx        — DGC result list
    ├── DeezerResults.tsx     — Deezer result list
    ├── MusicBrainzResults.tsx — MusicBrainz result list
    ├── BandcampResults.tsx   — Bandcamp result list
    ├── TagComparison.tsx     — file vs catalog tags + Extra Tags (editable)
    ├── TrackMatcher.tsx      — track matching controls + multi-artist toggle
    ├── MatchRow.tsx          — single track row (similarity %, editable name)
    ├── SingleArtistTracks.tsx — track list for single-artist albums
    ├── MultiArtistTracks.tsx  — track list for compilations (with artist fields)
    ├── TrackArtistField.tsx  — inline artist edit
    ├── ApplyPanel.tsx        — WRITE & MOVE / RENAME / WRITE / CANCEL
    ├── ProgressOverlay.tsx   — operation result with auto-scroll log (uses DiffBlock)
    ├── ResultModal.tsx       — success/error modal
    ├── SettingsModal.tsx     — sources toggles + tag defaults + cleanup patterns
    ├── WebfetchOverlay.tsx   — sandboxed iframe
    ├── LibraryTree.tsx       — tree with context menu, inline rename, move dialog
    ├── LibraryView.tsx       — card grid, alphabetical nav, infinite scroll, genre cloud
    ├── GenreCloud.tsx        — tag cloud filter by genre in library view
    ├── DiffLine.tsx          — LCS-based diff highlight for renamed files
    ├── SimPercent.tsx        — color-coded similarity percentage display
    ├── SearchBar.tsx         — artist + album inputs with enable/disable
    ├── FolderPicker.tsx      — filesystem browser (drives/roots, expand-to-path)
    ├── ContextMenu.tsx       — right-click menu
    ├── ErrorBoundary.tsx     — React error boundary
    └── Footer.tsx            — paths display + FolderPicker
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
| GET | `/api/collection` | All library albums |
| GET | `/api/collection/:bandId` | Albums for a specific band |
| GET | `/api/cover/:bandId/:postId` | Serve album cover image |
| POST | `/api/files/rename` | Rename file/folder |
| POST | `/api/files/move` | Move file/folder (cross-device) |
| POST | `/api/files/delete` | Delete file/folder |
| GET | `/api/directory/roots?path=` | List filesystem roots (optional custom path) |
| GET | `/api/directory/children` | Browse directory |
| GET | `/api/webfetch?url=` | SSRF-protected page fetch |
| POST | `/api/parse-genres` | Parse genres from HTML (max 1MB) |
| GET | `/api/browser/status` | Puppeteer browser status |
| POST | `/api/cache/clear` | Clear cache |

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
[3] TrackMatcher.tsx — match tracks (similarity + number-first)
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

## Contributing

При внесении изменений в код:

1. **Обновить `client/src/build.ts`** — увеличить номер сборки и добавить запись в `CHANGES`
2. **Обновить `README.md`** — если меняется структура, API, конфигурация
3. **Обновить `todo.md`** — пометить исправленные пункты

## Notes

- **Puppeteer** — persistent browser, `userDataDir` in `user_data/`, shared by DGC + Bandcamp
- **Cloudflare** — manual challenge on first run
- **Taxonomy** — genre/type from DGC JS, 7d TTL cache
- **MusicBrainz** — rate limit 1 req/sec, User-Agent required, Lucene query escaping, 30+ extra tag mappings
- **Deezer** — 120ms delay between album detail requests
- **Bandcamp** — search via Puppeteer (JS challenge), album details via JSON-LD
- **music-metadata** — single-pass duration detection, ERR shown for undetectable files
- **Library** — filesystem-based (`library/{bandId}/{postId}/album.json` + cover images), auto-populates discography from DGC API on tag
- **Discography pagination** — duplicate-safe: tracks seen postIds to avoid infinite loops from DGC API returning stale offsets
- **CSS hover** — utility classes (hover-bg, hover-toolbar, hover-red, hover-lift) replace JS event handlers
- **.env.example** — содержит `VITE_API_BASE=/api` (для `api.ts`) и `VITE_API_BASE_URL=http://localhost:3000` (прокси Vite); сервер по умолчанию на порту `3000`
- **Build artifacts** — compiled `.js`, `.d.ts`, `.js.map` files in `server/src/` are gitignored and were cleaned up


## License

MIT
