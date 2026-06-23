# DGC Tagger - Client

Frontend for the DGC Tagger application. React 19 + TypeScript + Vite.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Structure

```
src/
├── App.tsx                    # Main layout + pipeline
├── api.ts                     # Axios + interceptors + AbortController
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
```

## Key Files

- **useAppContext.tsx** — all state and business logic (useReducer)
- **TrackMatcher.tsx** — track matching + compilation mode toggle
- **TagComparison.tsx** — tag editing with similarity scoring
- **api.ts** — all API calls with AbortController cleanup
