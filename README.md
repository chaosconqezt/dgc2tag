# DGC Tagger

Desktop app for batch-tagging MP3 files from [Deathgrind Club](https://deathgrind.club), [Deezer](https://deezer.com), and [MusicBrainz](https://musicbrainz.org).

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
- **Extra Tags panel** — Current (in file) vs New (to be written)
- **Result modal** — detailed tag change report instead of alert()
- **Puppeteer integration** — persistent browser, Cloudflare bypass
- **Resizable sidebar** — drag borders to resize library tree / matches / main panel
- **Source toggles** — enable/disable search sources in Settings
- **Tree badges** — nested dir count; audio file count on selected folder

## Architecture

- **Single process** — Express + Vite middleware, one port
- **Dev mode** — `NODE_ENV !== 'production'` → tsx watch + Vite `middlewareMode: true`
- **Prod mode** — Express serves `client/dist` as static
- **Plugin sources** — `server/src/sources/` with `SearchSource` interface
- **Unified SearchResult** — all sources normalize to common type
- **Data-driven tags** — `writeUserDefinedText(current, Record<string, string | undefined>)`
- **npm workspaces** — hoisted to root

## Configuration

- `server/config.default.json` — defaults (in git)
- `server/config.json` — user settings (in .gitignore)

## Project Structure

```
server/src/
├── index.ts          — Express API routes + Vite middleware
├── sources/          — plugin architecture
│   ├── types.ts      — SearchSource interface
│   ├── index.ts      — registry sources[] + getSource(id)
│   ├── dgc.ts        — wrapper over scraper.ts
│   ├── deezer.ts     — wrapper over deezer.ts
│   └── musicbrainz.ts — wrapper over musicbrainz.ts
├── scraper.ts        — puppeteer + stealth, DGC API
├── deezer.ts         — Deezer API (axios)
├── musicbrainz.ts    — MusicBrainz API + FIELD_MAP
├── tagWriter.ts      — ID3 writing (data-driven writeUserDefinedText)
├── tagger.ts         — ID3 reading + music-metadata for duration
├── scanner.ts        — filesystem traversal (lazy + recursive)
├── config.ts         — config.json load/save
├── cache.ts          — file cache for bands/releases
├── logger.ts         — leveled logger (debug/info/warn/error)
└── trackUtils.ts     — track number extraction, getMp3Files, path validation

client/src/
├── main.tsx
├── App.tsx           — layout + resizable panels
├── api.ts            — axios + interceptors
├── types.ts          — SearchResult, AlbumTags, MatchResult, etc.
├── sourceConfigs.ts  — [{ id, label, color }]
├── hooks/
│   ├── useAppContext.tsx — reducer + composition (87 lines)
│   ├── appReducer.ts     — state, actions, reducer
│   ├── useSearch.ts      — search + select handlers
│   ├── useLibrary.ts     — library + folder select
│   ├── useConfig.ts      — config + cache
│   ├── useTagActions.ts  — applyTags
│   └── useWebfetch.ts    — webfetch overlay
├── utils/
│   ├── index.ts          — stripParentheses, generateParsedTracks
│   ├── similarity.ts     — Levenshtein distance
│   └── trackMatching.ts  — matchTracks, parseCompilationTracklist
└── components/
    ├── styles.ts             — COLORS, FONT, FS, simColor
    ├── ResultCard.tsx        — 2-line card (cover + artist/year/album/label)
    ├── SearchResults.tsx     — vertical list of source results
    ├── DgcResults.tsx
    ├── DeezerResults.tsx
    ├── MusicBrainzResults.tsx
    ├── TagComparison.tsx     — file vs catalog tags + Extra Tags
    ├── TrackMatcher.tsx      — track matching panel
    ├── MatchRow.tsx          — single track row
    ├── SingleArtistTracks.tsx
    ├── MultiArtistTracks.tsx
    ├── TrackArtistField.tsx  — inline artist edit
    ├── ApplyPanel.tsx        — WRITE & MOVE / RENAME / WRITE / CANCEL
    ├── ResultModal.tsx
    ├── SettingsModal.tsx
    ├── WebfetchOverlay.tsx
    ├── LibraryTree.tsx       — tree with dir count badges
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
| POST | `/api/config` | Save config |
| POST | `/api/config/write-track-names` | Toggle track name writing |
| POST | `/api/config/write-track-artists` | Toggle track artist writing |
| GET | `/api/library` | Library tree |
| GET | `/api/library/children?dirPath=` | Lazy-load directory children |
| GET | `/api/tags?folderPath=` | AlbumTags from folder |
| POST | `/api/search` | DGC search (compatibility) |
| POST | `/api/search-{sourceId}` | Auto-generated source search |
| GET | `/api/{sourceId}/:id` | Auto-generated source details |
| GET | `/api/post/:id` | DGC post details |
| POST | `/api/tags/update` | Write tags + diff + rename/move |
| POST | `/api/cache/clear` | Clear cache |
| GET | `/api/webfetch?url=` | SSRF-protected page fetch |
| POST | `/api/parse-genres` | Parse genres from HTML |
| GET | `/api/browser/status` | Puppeteer browser status |

## Tagging Pipeline

```
[1] tagger.ts — read tags from folder
    ▼
[2] TagComparison.tsx — edit tags (file vs catalog + Extra Tags)
    ▼
[3] TrackMatcher.tsx — match tracks (prefix/contains)
    ▼
[4] ApplyPanel.tsx — WRITE & MOVE / RENAME / WRITE / CANCEL
    ▼
[5] ResultModal.tsx — result: tags old→new, renamed files
    ▼
[6] tagWriter.ts — write (writeUserDefinedText data-driven)
```

## Security

- SSRF: `/api/webfetch` — allowlist `deathgrind.club`, `cdn.deathgrind.club`
- Path traversal: `assertInsideMusicRoot()` on all file operations
- AbortController cleanup — no memory leaks

## Notes

- **Puppeteer** — persistent browser, `userDataDir` in `user_data/`
- **Cloudflare** — manual challenge on first run
- **Taxonomy** — genre/type from DGC JS, 7d TTL cache
- **MusicBrainz** — rate limit 1 req/sec, User-Agent required
- **music-metadata** — used for accurate track duration detection

## Open TODOs

- [ ] Extend format support: FLAC, M4A, OGG (scanner detects them, tagger/writer don't)

## License

MIT
