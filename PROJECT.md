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
├── sources/          — плагинная архитектура источников
│   ├── types.ts      — interface SearchSource { id, label, accentColor, search(), getDetails?() }
│   ├── index.ts      — реестр sources[] + getSource(id)
│   ├── dgc.ts        — обёртка над scraper.ts
│   ├── deezer.ts     — обёртка над deezer.ts
│   └── musicbrainz.ts — обёртка над musicbrainz.ts
├── scraper.ts        — puppeteer + stealth, DGC API
├── deezer.ts         — Deezer API
├── musicbrainz.ts    — MusicBrainz API + FIELD_MAP для динамического извлечения тегов
├── tagWriter.ts      — запись ID3 (writeUserDefinedText data-driven)
├── tagger.ts         — чтение ID3 тегов из папки
├── scanner.ts        — обход файловой системы
├── config.ts         — config.json load/save
├── cache.ts          — файловый кеш bands/releases
├── logger.ts         — leveled logger
└── trackUtils.ts     — извлечение track# из ID3/filename

client/src/
├── main.tsx          — точка входа
├── App.tsx           — layout + пайплайн данных
├── api.ts            — axios + interceptors + generic sourceSearch/sourceGetDetails
├── types.ts          — SearchResult (source, id), AlbumTags, MatchResult
├── sourceConfigs.ts  — конфиги источников [{ id, label, color }]
├── index.css         — CSS-переменные :root + focus-visible
├── hooks/
│   └── useAppContext.tsx — useReducer: состояние + бизнес-логика
├── utils/
│   ├── similarity.ts    — Levenshtein distance
│   └── trackMatching.ts — matchTracks() с prefix/contains
└── components/
    ├── styles.ts          — COLORS через var(--*), FONT, FS
    ├── ResultCard.tsx     — единая карточка с hover preview
    ├── SearchResults.tsx  — DGC + Deezer + MB (горизонтальный scroll)
    ├── TagComparison.tsx  — теги file vs site + Extra Tags (Current/New)
    ├── TrackMatcher.tsx   — матчинг + TRACKS
    ├── ApplyPanel.tsx     — WRITE & MOVE / WRITE & RENAME / WRITE / ОТМЕНА
    ├── ResultModal.tsx    — модальное окно результата
    ├── SettingsModal.tsx  — настройки (Escape)
    ├── WebfetchOverlay.tsx — превью DGC (Escape)
    ├── LibraryTree.tsx    — дерево (hover)
    ├── SearchBar.tsx      — поиск
    └── Footer.tsx

music/               ← исходная библиотека
music_processed/     ← результат после MOVE
user_data/           ← puppeteer cookies/session
```

## Плагинная архитектура источников

### Добавление нового источника

1. Создать `server/src/sources/my-source.ts`:

```typescript
import type { SearchSource } from './types.js';

export const mySource: SearchSource = {
  id: 'mysource',           // → POST /api/search-mysource, GET /api/mysource/:id
  label: 'My Source',
  accentColor: '#aabbcc',

  async search(artist, album) {
    // вернуть массив любых объектов — клиент конвертирует
    return fetchFromApi(artist, album);
  },

  async getDetails(id) {     // опционально
    return fetchDetails(id);
  },
};
```

2. Добавить в `server/src/sources/index.ts`:

```typescript
import { mySource } from './my-source.js';
export const sources: SearchSource[] = [..., mySource];
```

3. Routes генерируются автоматически:
   - `POST /api/search-{id}` → `src.search()`
   - `GET /api/{id}/:id` → `src.getDetails()`

4. Клиент: добавить state + handler в `useAppContext.tsx`, компонент в `SearchResults.tsx`

### Текущие источники

| ID | Лейбл | Цвет | Search | Details |
|----|-------|------|--------|---------|
| `dgc` | DGC | `#ef4444` | ✅ | ✅ `/api/post/:id` |
| `deezer` | Deezer | `#4ade80` | ✅ | — |
| `mbrainz` | MusicBrainz | `#f97316` | ✅ | ✅ `/api/mbrainz/:id` |

## Unified SearchResult

Все источники возвращают данные, которые клиент нормализует в `SearchResult`:

```typescript
interface SearchResult {
  source: string;            // 'dgc' | 'deezer' | 'mbrainz' | ...
  id: string;                // нормализованный ID
  postId: number;            // DGC: >0, Deezer: <0, MB: 0
  albumName, artist, albumArtist, coverUrl, country, year, label,
  genres, releaseType, url, parsedTracks, extraTags, compilation,
  // ... source-specific поля
}
```

## writeUserDefinedText — data-driven

```typescript
// Было: 12 позиционных параметров
writeUserDefinedText(current, country, releaseType, postId, deezerId, mbReleaseId, ...)

// Стало: Record<string, string | undefined>
writeUserDefinedText(current, {
  'Country': tags.country,
  'DGC_POST_ID': tags.postId != null ? String(tags.postId) : undefined,
  'MusicBrainz Album Id': (tags as any).musicbrainzReleaseId,
  // ... добавишь строку = добавился тег
})
```

## MusicBrainz — FIELD_MAP

Динамическое извлечение всех полей MB API:

```typescript
const FIELD_MAP = {
  'id': 'MusicBrainz Album Id',
  'status': 'MusicBrainz Album Status',
  'date': 'originalyear',
  'country': 'MusicBrainz Album Release Country',  // ≠ Country исполнителя!
  'artist-credit.0.artist.id': 'MusicBrainz Artist Id',
  'label-info.0.catalog-number': 'CATALOGNUMBER',
  'release-group.id': 'MusicBrainz Release Group Id',
  // ... рекурсивно все примитивные значения
};
```

## Пайплайн тегирования

```
[1] tagger.ts — чтение тегов из папки (ключ = полный путь)
    ▼
[2] TagComparison.tsx — редактирование тегов
    │  Поля: Artist, Album Artist, Album, Year, Genre, Country, Label, Type
    │  Extra Tags: Current (что в файле) vs New (что запишется)
    ▼
[3] TrackMatcher.tsx — матчинг (prefix/contains для "Track (Cover)")
    ▼
[4] ApplyPanel.tsx — WRITE & MOVE / WRITE & RENAME / WRITE / ОТМЕНА
    ▼
[5] ResultModal.tsx — результат: теги old→new, rename файлов
    ▼
[6] tagWriter.ts — запись (writeUserDefinedText data-driven)
```

## CSS-переменные

```css
:root {
  --bg, --card-bg, --panel-bg, --input-bg, --input-bg-alt;
  --border, --border-light;
  --text, --text-muted, --text-dim, --text-faint, --text-invisible;
  --red, --green, --yellow, --purple;
  --green-bg, --green-border, --purple-bg, --purple-border;
}
```

## UI UX

- **Focus indicators**: `:focus-visible` на всех input/button/a
- **Hover states**: sidebar, tree items, tag rows, track rows, ApplyPanel
- **Escape**: закрывает все модалки
- **Result modal**: теги old→new, rename файлов вместо alert()
- **Hover preview**: увеличенная обложка под курсором
- **Track matching**: prefix/contains для файлов с суффиксами

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/config` | Конфигурация |
| POST | `/api/config` | Сохранить config |
| GET | `/api/library` | Дерево библиотеки |
| GET | `/api/tags?folderPath=` | AlbumTags из папки |
| POST | `/api/search` | Поиск DGC (останется для совместимости) |
| POST | `/api/search-{sourceId}` | **Авто-генерация** из sources/ |
| GET | `/api/{sourceId}/:id` | **Авто-генерация** деталей |
| POST | `/api/tags/update` | Запись тегов + diff |
| POST | `/api/cache/clear` | Очистить кеш |

## Безопасность

- SSRF: `/api/webfetch` — allowlist `deathgrind.club`
- Path traversal: проверка `musicRoot` для всех file ops
- AbortController cleanup — нет утечек памяти

## Заметки

- **Puppeteer** — persistent browser, `userDataDir` в `user_data/`
- **Cloudflare** — челлендж вручную при первом запуске
- **Taxonomy** — genre/type из DGC JS, кэш 7d TTL
- **MusicBrainz** — rate limit 1 req/sec, User-Agent обязателен
