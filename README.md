# DGC Tagger

Desktop application for batch-tagging MP3 files from [Deathgrind Club](https://deathgrind.club), [Deezer](https://deezer.com), and [MusicBrainz](https://musicbrainz.org).

## Features

- **3 search sources** — DGC (red), Deezer (green), MusicBrainz (orange) in parallel
- **Plugin architecture** — add new sources with 1 file + 1 line in registry
- **Compilation mode** — auto-detect VA compilations, per-track artist parsing
- **Local tags editing** — edit tags without search results
- **Batch tag writing** — write ID3 tags, rename files, move to output folder
- **Track matching** — prefix/contains matching for files like "Track (Cover)"
- **Tag preservation** — IDs preserved across source switches
- **Extra Tags panel** — Current (in file) vs New (to be written)
- **Result modal** — detailed tag change report instead of alert()
- **Puppeteer integration** — persistent browser, Cloudflare bypass

## Quick Start

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev mode — tsx watch + Vite middleware |
| `npm run build` | Build client |
| `npm start` | Production mode |

## Adding a New Source

1. Create `server/src/sources/my-source.ts`:

```typescript
import type { SearchSource } from './types.js';
export const mySource: SearchSource = {
  id: 'mysource',
  label: 'My Source',
  accentColor: '#aabbcc',
  async search(artist, album) { return fetchFromApi(artist, album); },
  async getDetails(id) { return fetchDetails(id); },  // optional
};
```

2. Register in `server/src/sources/index.ts`:

```typescript
import { mySource } from './my-source.js';
export const sources = [..., mySource];
```

Routes auto-generated: `POST /api/search-mysource`, `GET /api/mysource/:id`

## Architecture

- **Single process** — Express + Vite middleware, one port
- **Plugin sources** — `sources/` with `SearchSource` interface
- **Unified SearchResult** — all sources normalize to common type
- **Data-driven tags** — `writeUserDefinedText(current, Record<string, string | undefined>)`
- **CSS Variables** — all colors in `:root`, themable
- **Workspaces** — npm workspaces, hoisted to root

## UI/UX

- Focus indicators (`:focus-visible`) on all interactive elements
- Hover states on sidebar, tree, tags, tracks, buttons
- Cover image preview on hover
- Escape closes all modals
- Result modal with tag change details

## Security

- SSRF protection on `/api/webfetch`
- Path traversal protection
- AbortController cleanup

## License

MIT
