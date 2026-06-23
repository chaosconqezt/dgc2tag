# DGC Tagger

**Архитектура:**
- **Single process**: Express + Vite middleware в одном процессе (`server/src/index.ts`)
- **Dev mode**: `NODE_ENV !== 'production'` → tsx watch + Vite `middlewareMode: true`, SPA fallback и HMR. Один порт.
- **Prod mode**: `NODE_ENV=production` → Express раздаёт `client/dist` статикой.
- **Vite config**: без proxy — Express сам на том же порту, `/api` маршруты идут в Express.
- Зависимости в root, hoisted через npm workspaces.

**Конфигурация:**
- `server/config.default.json` — дефолтные значения (в git)
- `server/config.json` — пользовательские настройки (в .gitignore)

## Запуск

```bash
npm run dev          # tsx watch server/src/index.ts — один процесс, Vite middleware, порт из config.json
npm run build        # сборка клиента (tsc -b && vite build)
npm start            # production запуск сервера (NODE_ENV=production)
```

## Структура проекта

```
server/src/
├── index.ts          — Express API routes + Vite middleware
├── tagger.ts         — чтение ID3 тегов из папки → AlbumTags
├── tagWriter.ts      — запись ID3, rename, move
├── scraper.ts        — puppeteer + stealth, DGC API
├── deezer.ts         — Deezer API поиск
├── scanner.ts        — обход файловой системы
├── config.ts         — config.json load/save
├── cache.ts          — файловый кеш bands/releases
├── logger.ts         — leveled logger (debug/info/warn/error)
└── trackUtils.ts     — извлечение track# из ID3/filename

client/src/
├── main.tsx          — точка входа (ReactDOM.createRoot)
├── App.tsx           — layout + пайплайн данных
├── api.ts            — axios-запросы к /api/* + interceptors + AbortController
├── types.ts          — AlbumTags, SearchResult, MatchResult, DeezerSearchResult
├── build.ts          — версия билда
├── index.css         — глобальные стили
├── hooks/
│   └── useAppContext.tsx — useReducer: всё состояние + бизнес-логика
├── utils/
│   ├── index.ts         — barrel export
│   ├── similarity.ts    — Levenshtein distance → %
│   └── trackMatching.ts — matchTracks(): remote vs local
└── components/
    ├── styles.ts          — дизайн-токены (COLORS, FONT...)
    ├── ErrorBoundary.tsx  — error boundary с fallback UI
    ├── LibraryTree.tsx    — дерево библиотеки
    ├── SearchBar.tsx      — поле поиска artist + album
    ├── SearchResults.tsx  — результаты поиска DGC + Deezer
    ├── DgcResults.tsx     — список результатов DGC
    ├── DeezerResults.tsx  — список результатов Deezer
    ├── TagComparison.tsx  — сравнение тегов file vs site
    ├── TrackMatcher.tsx   — потрековый матчинг + TRACKS панель
    ├── ApplyPanel.tsx     — кнопки WRITE/RENAME/MOVE
    ├── SettingsModal.tsx  — настройки
    ├── WebfetchOverlay.tsx — превью страницы DGC
    └── Footer.tsx         — подвал

music/               ← исходная библиотека
music_processed/     ← результат после MOVE
user_data/           ← puppeteer cookies/session
```

## Пайплайн тегирования

```
[1] tagger.ts — чтение тегов из папки
    │  Читает каждый MP3, ключуя по ПОЛНОМУ ПУТИ (immutable identifier):
    │    filePath = path.join(folderPath, filename)
    │  Возвращает AlbumTags:
    │    files[]              — ПОЛНЫЕ ПУТИ MP3 файлов
    │    trackArtists         — Record<filePath, TPE1>   (артист трека)
    │    trackTitles          — Record<filePath, title>  (название трека)
    │    trackDurations       — Record<filePath, duration>
    │    artists              — уникальные TPE1 (кандидаты артистов)
    │    albumArtists         — уникальные TPE2
    │    artist               — TPE1 первого файла (или TPE2)
    │    albumArtist          — TPE2 первого файла (или TPE1)
    ▼
[2] TagComparison.tsx — редактирование тегов
    │  Два режима:
    │  — С найденным релизом: локальные теги (file) vs данные скрапера (site)
    │  — Без релиза: локальные теги как source для обеих колонок (LOCAL TAGS)
    │  Поля: Artist, Album Artist, Album, Year, Genre, Country, Label, Type
    │  ID строка: DGC ID + Deezer ID из локальных тегов (read-only)
    │
    │  Сохранение данных при переключении источника (DGC ↔ Deezer):
    │  — country, label, releaseType: sourceValue ?? localTagValue
    │  — postId/deezerId: всегда сохраняются оба, не затирают друг друга
    ▼
[3] TrackMatcher.tsx — потрековый матчинг + TRACKS панель
    │  Два режима:
    │  — С albumDetails: matchTracks() по parsedTracks из скрапера
    │  — Без albumDetails: генерация parsedTracks из localTags.files/trackTitles/trackArtists
    │
    │  Compilation mode:
    │    — авто-детект: albumDetails.compilation или artists.length > 1
    │    — тогл "Compilation (multi-artist)" в шапке TRACKS панели
    │    — парсинг: NN. Artist - Title → split на " - " → { num, artist, name }
    │
    │  TRACKS панель:
    │    — показывает локальные имена треков (+артист трека) из тегов файла
    │    — артист трека отображается ТОЛЬКО если compilation=true или артистов >1
    │    — если один артист у альбома, артист трека = артист альбома
    │    — галка titles: включает запись имён треков из скрапа в ID3
    │    — Write & Rename: пишет имя трека (+артист трека из скрапа) → rename файла
    │    — Move & Write: пишет теги → переносит в outputFolder/artist/year - album/
    ▼
[4] App.tsx applyTags() — сбор данных
    │  Панели рендерятся всегда когда localTags есть (даже без найденного релиза).
    │
    │  Строит trackArtists и trackNames ПО ПОЛНОМУ ПУТИ:
    │    trackArtists[filePath] = editedOrRemote.artist  (из скрапа или localTags)
    │    trackNames[filePath]   = editedOrRemote.name     (из скрапа или localTags)
    │
    │  tagsToApply собирается из: editedSiteValues > remote > localTags
    │  trackNames собирается всегда при Rename/Move (не зависит от writeTrackNames)
    ▼
[5] tagWriter.ts — запись
    │  writeTags():       TPE1 = perTrackArtist (из trackArtists[filePath]), TPE2 = albumArtist
    │  renameFilesInPlace: имя = "NN. trackArtist - title.mp3"
    │    — trackArtist из trackArtists[filePath], fallback на albumArtist
    │    — title из trackNames[filePath], fallback на ID3 title
    │  moveProcessedFiles: папка = outputRoot/albumArtist/year - album/
    │    — файлы переименовываются аналогично renameFilesInPlace
    │
    │  writeUserDefinedText: запись кастомных ID3 тегов:
    │    — Country, RELEASETYPE, DGC_POST_ID, DEEZER_ID
    │    — При переключении источника: preservation через fallback на localTags
```

## Ключевая архитектурная идея: immutable identifier = полный путь

**Проблема:** раньше ключи trackArtists/trackNames были по имени файла (`01.mp3`). При переименовании файл получал новое имя, и последующие операции (move) не могли найти артиста — ключ больше не совпадал.

**Решение:** ВСЕ ключи = **полный путь к файлу** (никогда не меняется):
- `tagger.ts` возвращает `files[]` как полные пути
- Клиент строит `trackArtists[filePath]` и `trackNames[filePath]`
- Сервер использует те же полные пути для write/rename/move

## Артист трека vs Артист альбома (не путать!)

| | TPE1 — Artist | TPE2 — Album Artist |
|---|---|---|
| **Что** | Кто исполняет трек | Кто записал альбом |
| **ID3 frame** | `tags.artist` | `tags.performerInfo` |
| **Компиляции** | Разные на трек | Один на весь альбом |
| **Используется для** | Имя файла при rename | Папка назначения при move |
| **Ключ в trackArtists** | Полный путь к файлу (NOT номер трека!) | Один на альбом |

**Правило записи:**
```ts
// TPE1: per-track artist (из trackArtists[filePath])
artist: perTrackArtist || resolvedArtist
// TPE2: только album artist
performerInfo: resolvedAlbumArtist
```

## Типы данных

```typescript
// Локальные теги (из MP3) — ключи = полный путь к файлу
interface AlbumTags {
  artist?: string; albumArtist?: string; album?: string; year?: string;
  genre?: string; country?: string; label?: string; releaseType?: string;
  trackCount?: number;
  files?: string[];                 // полные пути
  trackTitles?: Record<string, string>;   // filePath → title
  trackArtists?: Record<string, string>;  // filePath → TPE1
  trackDurations?: Record<string, number>;
  postId?: number;
  deezerId?: number;
  artists?: string[];               // уникальные TPE1
  albumArtists?: string[];          // уникальные TPE2
}

// Результат скрапинга DGC / Deezer
interface SearchResult {
  postId: number; artist: string; albumArtist: string;
  albumName: string | null; genres: string[];
  coverUrl: string | null; country: string | null; year: string | null;
  label: string | null; genreIds?: number[];
  releaseType: string | null; typeId?: number | null; url: string;
  tracklist?: string; notes?: string; youtube?: string;
  metalArchivesUrl?: string; artworkBy?: string;
  compilation?: boolean;
  parsedTracks?: { num: string; artist: string; name: string; duration?: number }[];
}

// Результат матчинга
interface MatchResult {
  remote: { num: string; artist: string; name: string; duration?: number };
  local: { num: string; name: string; file: string; artist?: string } | null;
  sim: number;
}

// Deezer результат
interface DeezerSearchResult {
  source: 'deezer'; albumId: number; albumName: string; artist: string;
  year: string | null; label: string | null; releaseType: string | null;
  compilation?: boolean;
  coverUrl: string; trackCount: number;
  tracks: { num: string; name: string; duration: number; artist?: string }[];
  url: string;
}
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/config` | Текущая конфигурация |
| POST | `/api/config` | Сохранить config |
| POST | `/api/config/write-track-names` | Переключить writeTrackNames |
| POST | `/api/config/write-track-artists` | Переключить writeTrackArtists |
| GET | `/api/library` | Дерево библиотеки |
| GET | `/api/library/children` | Lazy load детей директории |
| GET | `/api/tags?folderPath=` | AlbumTags из папки |
| POST | `/api/search` | Поиск альбома на DGC |
| POST | `/api/search-deezer` | Поиск альбома на Deezer |
| GET | `/api/post/:id` | Детали альбома с DGC |
| POST | `/api/tags/update` | Запись тегов (write/rename/move) |
| GET | `/api/webfetch?url=` | Fetch страницы через puppeteer |
| POST | `/api/parse-genres` | Парсинг жанров из HTML |
| GET | `/api/browser/status` | Статус puppeteer |
| POST | `/api/cache/clear` | Очистить кеш |

## Режимы применения тегов

- **WRITE** — запись ID3 тегов в файлы
- **WRITE & RENAME** — теги + переименование в `NN. Artist - Title.mp3`
- **MOVE & WRITE** — теги + переименование + перемещение в `outputFolder/Artist/Year - Album/`

## Работа с тегами

### Панели всегда видны
TAG COMPARISON и TRACKS показываются при выборе папки с MP3, даже без найденного релиза на DGC/Deezer. Когда релиз не найден — локальные теги становятся источником для редактирования.

### Два режима TagComparison
- **С релизом**: локальные теги (file) vs данные скрапера (site) — сравнение
- **Без релиза**: локальные теги как source для обеих колонок — ручное редактирование

### Сохранение тегов при переключении источника
При переключении между DGC и Deezer source данные НЕ затираются:
- `postId` и `deezerId` — всегда сохраняются оба
- `country`, `label`, `releaseType` — fallback на localTagValue если source не имеет значение
- Deezer `label` берётся из API Deezer (`detail.label`)
- При ClearSelectionState: `selectedDeezer` и `tagEnabled` сбрасываются к дефолтам

### Compilation mode (VA сборники)
Авто-детект и парсинг треклистовVarious Artists сборников:
- **Сервер**: `scraper.ts` — bandNames=["va"]||["various artists"] → `compilation=true`
- **Сервер**: `deezer.ts` — compilation flag из Deezer API
- **Клиент**: `useAppContext.tsx` — `compilation` state, `SET_COMPILATION` action
- **UI**: `TrackMatcher.tsx` — тогл "Compilation (multi-artist)" в TRACKS панели
- **Парсинг**: строка `NN. Artist - Title` → split на " - " → `{ num, artist, name }`

## Конфигурация (`server/config.json`)

```json
{
  "musicRoot": "c:\\vibecode\\dgc2tag\\music",
  "port": 3000,
  "tagDefaults": {
    "artist": true, "albumArtist": true, "album": true, "year": true,
    "genre": true, "country": true, "label": true, "releaseType": true,
    "postId": true
  },
  "writeTrackNames": true,
  "writeTrackArtists": true,
  "outputFolder": "c:\\vibecode\\dgc2tag\\music_processed\\",
  "outputMode": "absolute"
}
```

Примечание: `config.ts` DEFAULTS используют другие значения (`test_muz`, порт 3001, `dgc`, `subfolder`) — они применяются только если `config.json` не существует. `TagDefaults` интерфейс не включает `postId`, но оно проходит через spread.

## Best Practices

- **Single process**: Express + Vite middleware в одном процессе. Один порт.
- **Dev mode**: `NODE_ENV !== 'production'` → tsx watch + Vite `middlewareMode: true`.
- **Prod mode**: `NODE_ENV=production` → Express раздаёт `client/dist` статикой.
- **tsx watch** для сервера — hot-reload без компиляции.
- **npm workspaces** — зависимости в root, hoisted. Не дублировать в client/server.
- **config.json** — дефолты в `config.default.json` (в git), пользовательские настройки в `config.json` (.gitignore).

## Безопасность

- **SSRF защита**: `/api/webfetch` валидирует URL по allowlist (`deathgrind.club`, `cdn.deathgrind.club`). Запросы к другим доменам → 403.
- **AbortController cleanup**: контроллеры удаляются из Map после завершения запроса (success/error). Предотвращает утечку памяти.
- **Startup error handling**: async IIFE обёрнут в try/catch + `process.exit(1)` при ошибке.
- **Path traversal**: `/api/tags`, `/api/library/children`, `/api/tags/update` проверяют что путь внутри musicRoot.

## Заметки

- **Puppeteer** — persistent browser, не закрывается между запусками. `userDataDir` в `user_data/`. Сброс: удали папку.
- **Cloudflare** — при первом запуске реши челлендж вручную в браузере. Session кэшируется.
- **Taxonomy** — genre/type mapping загружается из DGC JS bundle, кэшируется в `taxonomy-cache.json` (7d TTL). Файл обновляется автоматически раз в неделю.
- **Music library** — папки `Artist/Year - Album/` с MP3.
- **Dev mode** — `npm run dev` запускает `tsx watch server/src/index.ts`. Vite middleware на том же порту. Нет отдельного dev сервера на 5173.
- **LibraryTree** — стрелки 6px, отступ между уровнями 5px, шрифт текста 15px.