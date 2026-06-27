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
- **Library** — card-based album grid with cover art, band grouping, alphabetical navigation, infinite scroll, genre cloud filter
- **Discography** — auto-populates band discography from DGC when tagging (with duplicate-safe pagination)
- **Compilation / multi-artist toggle** — auto-detects VA compilations, single checkbox to flatten or split tracks
- **Track matching** — Levenshtein similarity (0–100%), number-first + fuzzy matching
- **Extra Tags panel** — editable extra tags with "Clear all" to remove from file
- **Diff-style rename** — terminal diff output showing exactly what changed in filenames
- **Batch tag writing** — write ID3 tags, rename files, move to output folder
- **Progress overlay** — shows operation result (moved/renamed files)
- **Puppeteer integration** — persistent browser (user_data/), Cloudflare bypass
- **Resizable panels** — drag borders to resize (positions saved to localStorage)
- **Source toggles** — enable/disable search sources in Settings
- **File operations** — rename, move, delete files with tree refresh
- **Folder picker** — browse filesystem roots (all drives on Windows), expand-to-path
- **Context menu** — right-click on files/folders for rename/move/delete

## Architecture (for LLMs)

### Data Flow

```
User folder click
  → scanner.ts (getLibraryTree — async recursive, cycle-safe via realpath + visited set)
  → tagger.ts (getTags — single-pass ID3 read via node-id3 + music-metadata for duration/bitrate)
  → SearchBar auto-fills artist/album from existing ID3 tags
  → handleSearch fires 4 parallel API calls (aborted on next search via cancelActiveRequests)
  → TagComparison (file tags vs catalog tags, editable, similarity % per field)
  → TrackMatcher (remote tracks vs local files, Levenshtein + number-first matching)
  → ApplyPanel (WRITE / WRITE & RENAME / WRITE & MOVE)
  → tagWriter.ts (NodeID3.write with raw file buffer, no _buffer spread)
  → response: { success, moved[], renamed[] }
```

### State Management

Single `useReducer` with 54 fields and 40+ action types in `client/src/hooks/appReducer.ts`. All actions are simple SET_* payloads — no thunks, no middleware.

Key hook composition in `useAppContext.tsx`:
- `createSearchActions` — 4 parallel sources, generation-based stale response guard
- `createLibraryActions` — tree, folder select, file ops
- `createConfigActions` — config + cache clearing
- `createWebfetchActions` — sandboxed iframe overlay
- `createApplyTags` — builds full tag payload from all edited fields, POSTs to server

### Search Cancellation Pattern

`client/src/hooks/useSearch.ts` uses two mechanisms:
1. **Generation counter** (`searchGenerationRef`) — incremented each search; .then() checks `searchGeneration.current === gen` before dispatching — ignores stale responses without rejecting.
2. **HTTP abort** — calls `api.cancelActiveRequests()` at start of each search, which aborts all AbortControllers created by the axios request interceptor.

### Plugin Source Architecture

**Server** (`server/src/sources/`):
```typescript
interface SearchSource {
  id: string;                  // used in route /api/search-{id}
  label: string;               // display name
  accentColor: string;         // UI color
  search(artist?, album?, query?): Promise<SearchResult[]>;
  getDetails?(id): Promise<SearchResult | null>;  // optional
}
```
Routes auto-generated in `server/src/index.ts:549-577`:
- `POST /api/search-${src.id}` → `src.search(artist, album, query)`
- `GET /api/${src.id}/:id` → `src.getDetails(id)` (if defined)

**Client** (`client/src/sourceConfigs.ts`):
```typescript
{ id: string, label: string, color: string }[]
```
Displayed in `SearchResults.tsx` as separate source lists with colored headers and result counters.

### Key Types

- **`AlbumTags`** (`server/src/types.ts`) — artist, albumArtist, album, year, genre, country, label, releaseType, trackCount, files[], trackTitles, trackArtists, trackDurations, postId, bandId, deezerId, extraTags, bitrateInfo
- **`SearchResult`** (`server/src/scraper.ts:30-62`) — unified format from all sources: source, id, postId, bandId, artist, albumName, coverUrl, country, year, label, genres, releaseType, parsedTracks, extraTags, musicbrainzReleaseId, catalogNumber, etc.
- **`DeezerSearchResult`** (`server/src/deezer.ts:7-21`) — separate type (albumId, tracks[] with artist/name/duration)
- **`MusicBrainzResult`** (`server/src/musicbrainz.ts:7-28`) — separate type (releaseId, artistId, releaseGroupId, catalogNumber, discId, originalYear, tracks[] with recordingId)

### Tag Writing Pipeline

**`server/src/tagWriter.ts`**:
1. `writeSingleTag(filePath, tags, trackArtists?, trackNames?)`:
   - Reads current tags via `NodeID3.read()` for default values only
   - Builds `updatedTags` with only explicit fields (no spread of _buffer)
   - Reads raw file buffer from disk via `fs.readFile()` (never uses `_buffer` from NodeID3)
   - Calls `NodeID3.write(updatedTags, fileBuffer)` — library merges new tags into existing
   - `writeUserDefinedText` — merges new custom fields, removes fields with undefined/empty

2. `renameFilesInPlace(folderPath, albumArtist, trackArtists, trackNames)`:
   - Renames to `{num}. {Artist} - {Title}.mp3`
   - Uses pre-written ID3 tags as source (write happens before rename in index.ts)

3. `moveProcessedFiles(sourceFolder, outputRoot, ...)`:
   - Moves folder to `{outputRoot}/{Artist}/{Year} - {Album}/`
   - Duplicate-safe: `(2)`, `(3)` suffix
   - Fallback: copy + delete on EXDEV (cross-device)
   - Cleans up empty source directories after move
   - `cleanupIgnorePatterns` config skips files like `.DS_Store`

## Configuration

- `server/config.default.json` — defaults (in git)
- `server/config.json` — user settings (in .gitignore)
- `enabledSources` — which search sources are active (persisted)
- Port from `process.env.PORT` (NOT `SERVER_PORT` — .env.example is just a template)

## Project Structure

```
server/src/
├── index.ts          — Express API routes + Vite middleware (608 lines)
├── sources/          — plugin architecture
│   ├── types.ts      — SearchSource interface
│   ├── index.ts      — registry: sources[] + getSource(id)
│   ├── dgc.ts        — wrapper over scraper.ts
│   ├── deezer.ts     — wrapper over deezer.ts (no getDetails)
│   ├── musicbrainz.ts — wrapper over musicbrainz.ts
│   └── bandcamp.ts   — wrapper over bandcamp.ts
├── scraper.ts        — puppeteer + stealth, DGC API, taxonomy (7d TTL cache), discography, SSRF fetch
├── bandcamp.ts       — Bandcamp search + JSON-LD album parser
├── deezer.ts         — Deezer API (axios) with rate limiting (120ms)
├── musicbrainz.ts    — MusicBrainz API + Lucene escaping + 30+ extra tag FIELD_MAP
├── tagWriter.ts      — ID3 writing, diff rename, folder move (source-level diff)
├── tagger.ts         — ID3 reading + music-metadata for duration (single pass)
├── library.ts        — album JSON storage, cover download, discography population (parallel-ready)
├── scanner.ts        — filesystem traversal (async, recursive, cycle-safe via realpath + visited, symlink-aware)
├── config.ts         — config.json load/save + enabledSources, cleanupIgnorePatterns
├── cache.ts          — file cache clear for bands/releases
├── logger.ts         — leveled logger (debug/info/warn/error) with timestamps
├── trackUtils.ts     — track number extraction, getMp3Files, path validation
└── types.ts          — AlbumTags, Id3Tags interfaces

client/src/
├── main.tsx
├── App.tsx           — layout + resizable panels + library/main view toggle + all modals
├── api.ts            — axios + interceptors (automatic AbortController), all API functions
├── types.ts          — FileNode, AlbumTags, SearchResult, MatchResult, DeezerSearchResult
├── sourceConfigs.ts  — [{ id, label, color }]
├── build.ts          — build version constant
├── index.css         — full dark theme, CSS variables, hover utilities, library grid, genre cloud
├── hooks/
│   ├── useAppContext.tsx — context provider + reducer composition (useReducer + 7 sub-hooks)
│   ├── appReducer.ts     — state (54 fields), actions (40+), reducer
│   ├── useSearch.ts      — parallel search, generation-based stale guard, cancel on new search
│   ├── useLibrary.ts     — tree fetch, folder select (auto-fills search), file operations
│   ├── useConfig.ts      — config + cache + enabledSources + cleanupIgnorePatterns
│   ├── useTagActions.ts  — build full tag payload from all edited fields, POST, progress overlay
│   └── useWebfetch.ts    — webfetch overlay (AbortController)
├── utils/
│   ├── index.ts          — stripParentheses, generateParsedTracks
│   ├── similarity.ts     — Levenshtein distance
│   └── trackMatching.ts  — matchTracks (number-first + fuzzy), parseCompilationTracklist, parseSingleArtistTracklist
└── components/
    ├── styles.ts             — COLORS, FONT, FS, ICON_BUTTON, PANEL_STYLE, ROW_STYLE, CHECKBOX
    ├── ResultCard.tsx        — compact search result card with cover hover preview
    ├── SearchResults.tsx     — 4 source lists with loading spinners and result counters
    ├── DgcResults.tsx        — DGC list (red accent)
    ├── DeezerResults.tsx     — Deezer list (green accent)
    ├── MusicBrainzResults.tsx — MusicBrainz list (orange accent)
    ├── BandcampResults.tsx   — Bandcamp list (teal accent)
    ├── TagComparison.tsx     — file vs catalog tags + Extra Tags section (collapsible, editable)
    ├── TrackMatcher.tsx      — track matching controls + multi-artist toggle + stats bar
    ├── MatchRow.tsx          — single track row: checkbox, num, local name, local dur, sim%, remote dur, remote num, input
    ├── SingleArtistTracks.tsx — track list for single-artist albums
    ├── MultiArtistTracks.tsx  — track list for compilations (with TrackArtistField)
    ├── TrackArtistField.tsx  — inline artist editor with checkbox
    ├── ApplyPanel.tsx        — WRITE & MOVE / WRITE & RENAME / WRITE / CANCEL buttons
    ├── ProgressOverlay.tsx   — operation progress with auto-scroll log
    ├── ResultModal.tsx       — success/error modal
    ├── SettingsModal.tsx     — sources toggles, tag defaults, cleanup ignore patterns
    ├── WebfetchOverlay.tsx   — sandboxed iframe with injected dark CSS
    ├── LibraryTree.tsx       — tree with context menu, inline rename, move dialog
    ├── LibraryView.tsx       — card grid, band grouping, alphabetical nav (ru locale), infinite scroll, genre cloud
    ├── SearchBar.tsx         — artist + album inputs with enable/disable checkboxes
    ├── FolderPicker.tsx      — filesystem browser (all drives on Windows, expand-to-path)
    ├── ContextMenu.tsx       — right-click menu
    ├── ErrorBoundary.tsx     — React error boundary
    └── Footer.tsx            — SRC/OUT paths display + FolderPicker trigger
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
| `deezer` | Deezer | `#4ade80` | ✅ | — (tracks in search response) |
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
| POST | `/api/tags/update` | Write tags + rename/move, returns JSON result |
| GET | `/api/collection` | All library albums |
| GET | `/api/collection/:bandId` | Albums for a specific band |
| GET | `/api/cover/:bandId/:postId` | Serve album cover image (jpg or webp) |
| POST | `/api/files/rename` | Rename file/folder |
| POST | `/api/files/move` | Move file/folder (cross-device copy+delete) |
| POST | `/api/files/delete` | Delete file/folder |
| GET | `/api/directory/roots` | List filesystem roots (all drives on Windows) |
| GET | `/api/directory/children` | Browse directory |
| GET | `/api/webfetch?url=` | SSRF-protected page fetch (allowlist: deathgrind.club) |
| POST | `/api/parse-genres` | Parse genres from HTML (regex-based, max 1MB) |
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
[1] tagger.ts — read tags from folder (single pass via music-metadata for duration/bitrate)
    ▼
[2] TagComparison.tsx — edit tags (file vs catalog + Extra Tags collapsible section)
    ▼
[3] TrackMatcher.tsx — match tracks (Levenshtein similarity + number-first)
    ▼
[4] ApplyPanel.tsx — WRITE & MOVE / RENAME / WRITE / CANCEL
    ▼
[5] tagWriter.ts — write (explicit fields only, no _buffer spread), rename, move
    ▼
[6] ProgressOverlay.tsx — result summary (moved/renamed counts) + ResultModal on close
```

## Security

- **SSRF**: `/api/webfetch` — allowlist `deathgrind.club`, `cdn.deathgrind.club`, redirects blocked via `redirect: 'manual'`
- **Path traversal**: `isInsideMusicRoot()` — `path.sep`-aware prefix check (case-insensitive on Windows, case-sensitive on Linux)
- **XSS**: WebfetchOverlay iframe uses `sandbox=""`
- **DoS**: body size limit 1MB
- **Config corruption**: mutex (promise-chain lock) prevents concurrent writes

## Important Gotchas (for LLM context)

- `tagWriter.ts` builds `updatedTags` with **explicit fields only** — never spread `currentTags` from `NodeID3.read()` to avoid leaking `_buffer` into the write call.
- `NodeID3.write(updatedTags, buffer)` always receives a raw file buffer from `fs.readFile()` — never from `_buffer`.
- `userDataDir` in puppeteer and `DevToolsActivePort` path use `USER_DATA_DIR` absolute constant from `__dirname` — not relative to CWD.
- Search cancellation uses both generation counter AND `cancelActiveRequests()`. Adding a new source must use the `api.*` functions that go through the axios interceptor.
- All `Server_SearchResult` tracks use `parsedTracks: { num, artist, name }[]`. Deezer uses a separate `DeezerSearchResult` type with `tracks: { num, name, duration, artist? }[]`.
- The `AlbumTags` interface has optional fields — every access should guard with `?.`.
- Config is stored in `server/config.json` (gitignored). Defaults in `config.default.json` (committed) and `DEFAULTS` object in `config.ts`.
- Env vars: `PORT` (server port), `LOG_LEVEL` (debug/info/warn/error), `HEADLESS` (puppeteer), `NODE_ENV` (dev/prod).

## Notes

- **Puppeteer** — persistent browser, absolute `USER_DATA_DIR` in `user_data/`, shared by DGC + Bandcamp
- **Cloudflare** — manual challenge on first run (browser window opens)
- **Taxonomy** — genre/type from DGC JS bundle, 7d TTL file cache (`server/taxonomy-cache.json`), fetched via `p.evaluate(fetch)`
- **MusicBrainz** — User-Agent required, Lucene query escaping, 30+ extra tag FIELD_MAP, track recording IDs mapped per-track
- **Deezer** — 120ms delay between album detail requests. No `getDetails` — full tracklist in search response.
- **Bandcamp** — search via Puppeteer (`.searchresult` selector), album details via JSON-LD (`script[type="application/ld+json"]`)
- **music-metadata** — single-pass duration detection, ERR shown for undetectable files
- **Library** — filesystem-based (`library/{bandId}/{postId}/album.json` + cover images), auto-populates discography from DGC API on tag
- **Discography pagination** — duplicate-safe: tracks seen postIds, 1.5s delay between pages
- **Drive detection (Windows)** — 26 parallel `fs.access` checks for A:-Z:
- **Symlinks** — resolved via `fs.realpath`, cycle-safe via `visited` set, followed recursively

## Open TODOs

- [ ] Extend format support: FLAC, M4A, OGG (scanner detects them, tagger/writer don't)
- [ ] `isInsideMusicRoot` case sensitivity on Linux
- [ ] `parseFilename` regex edge cases with dotted track numbers
- [ ] `localeCompare` numeric sorting for file listing
- [ ] **Album merge mode**: if tracks from one album are scattered across folders, allow merging into one target folder instead of overwriting. Also handle missing tracks — add them into existing album folder rather than skip.

## License

MIT
