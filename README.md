# DGC Tagger

Desktop application for batch-tagging MP3 files from [Deathgrind Club](https://deathgrind.club) and [Deezer](https://deezer.com) catalogs.

## Features

- **DGC + Deezer search** — find releases on both platforms
- **Compilation mode** — auto-detect VA compilations, per-track artist parsing
- **Local tags editing** — edit tags without search results, panels always visible
- **Batch tag writing** — write ID3 tags, rename files, move to output folder
- **Track matching** — automatic matching of remote tracks to local files
- **Tag preservation** — DGC ID, Deezer ID, country, label preserved across source switches
- **Puppeteer integration** — persistent browser for DGC API, Cloudflare bypass

## Quick Start

```bash
npm install
npm run dev        # Start dev server (port from config.json)
```

Open `http://localhost:3000` in your browser.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev mode — tsx watch + Vite middleware, single port |
| `npm run dev:server` | Dev server only — tsx watch |
| `npm run dev:client` | Dev client only — Vite |
| `npm run build` | Build client (tsc -b && vite build) |
| `npm start` | Production mode |

## Configuration

Edit `server/config.json` (auto-created on first run):

```json
{
  "musicRoot": "/path/to/your/music",
  "port": 3000,
  "outputFolder": "/path/to/output",
  "outputMode": "absolute"
}
```

## How It Works

1. **Select folder** — browse your music library in the sidebar
2. **Search** — find the release on DGC or Deezer
3. **Compare tags** — review and edit tags in the comparison panel
4. **Match tracks** — verify track matching in the tracks panel
5. **Apply** — write tags, rename files, and/or move to output folder

### Apply Modes

- **WRITE** — write ID3 tags only
- **WRITE & RENAME** — tags + rename to `NN. Artist - Title.mp3`
- **WRITE & MOVE** — tags + rename + move to `outputFolder/Artist/Year - Album/`

## Architecture

- **Single process** — Express + Vite middleware in one Node.js process
- **Dev mode** — tsx watch + Vite `middlewareMode: true`, HMR
- **Client** — React 19 + TypeScript + Vite
- **Server** — Express 5 + Puppeteer + NodeID3
- **Workspaces** — npm workspaces, dependencies hoisted to root

## Security

- SSRF protection on `/api/webfetch` — only `deathgrind.club` URLs allowed
- Path traversal protection — all file operations validated against `musicRoot`
- AbortController cleanup — no memory leaks from request tracking

## Project Structure

```
client/src/
├── App.tsx                    # Main layout + pipeline
├── api.ts                     # Axios + interceptors
├── build.ts                   # Build version
├── index.css                  # Global styles
├── main.tsx                   # Entry point
├── types.ts                   # AlbumTags, SearchResult, etc.
├── hooks/
│   └── useAppContext.tsx       # useReducer: state + business logic
├── utils/
│   ├── index.ts               # Barrel export
│   ├── similarity.ts          # Levenshtein distance
│   └── trackMatching.ts       # matchTracks(): remote vs local
└── components/
    ├── styles.ts              # Design tokens (COLORS, FONT...)
    ├── ErrorBoundary.tsx      # Error boundary with fallback UI
    ├── LibraryTree.tsx        # File browser
    ├── SearchBar.tsx          # Artist + album search field
    ├── SearchResults.tsx      # DGC + Deezer results
    ├── DgcResults.tsx         # DGC results list
    ├── DeezerResults.tsx      # Deezer results list
    ├── TagComparison.tsx      # Tag editing panel
    ├── TrackMatcher.tsx       # Track matching panel
    ├── ApplyPanel.tsx         # WRITE/RENAME/MOVE buttons
    ├── SettingsModal.tsx      # Settings
    ├── WebfetchOverlay.tsx    # DGC page preview
    └── Footer.tsx             # Footer

server/src/
├── index.ts                   # Express routes + Vite middleware
├── scraper.ts                 # DGC API (Puppeteer + stealth)
├── deezer.ts                  # Deezer API
├── tagger.ts                  # Read ID3 tags from folder
├── tagWriter.ts               # Write ID3, rename, move
├── scanner.ts                 # File system traversal
├── config.ts                  # config.json load/save
├── cache.ts                   # File cache for bands/releases
├── logger.ts                  # Leveled logger
└── trackUtils.ts              # Extract track# from ID3/filename
```

## License

MIT
