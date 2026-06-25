# TODO

## Баги и improvements

### Critical

#### 1. ~~AbortController memory leak (client/src/api.ts:33-40)~~ ✅ FIXED
Контроллеры добавляются в activeControllers в request interceptor, но никогда не удаляются из response interceptor. Map растёт бесконечно.

Fix: удалять контроллер из activeControllers в response interceptor:
```
response interceptor success: activeControllers.delete(requestId)
response interceptor error: activeControllers.delete(requestId)
```

#### 2. ~~SSRF в /api/webfetch (server/src/index.ts:237-250)~~ ✅ FIXED
Эндпоинт принимает произвольный URL от клиента и fetch'ит его сервер-side через Puppeteer. Нет валидации URL — можно достучаться до внутренних сервисов.

Fix: валидировать URL, блокировать приватные IP, разрешать только deathgrind.club.

#### 3. ~~Unhandled promise при старте (server/src/index.ts:310-317)~~ ✅ FIXED
Async IIFE без try/catch. Если ensureTaxonomy() или app.listen() упадёт — молчаливый крах.

Fix: обернуть в try/catch, логировать ошибку, process.exit(1).

### Medium

#### 4. ❌ Rules of Hooks violation (client/src/components/TagComparison.tsx:31,68)
Early return (строка 31) до useMemo (строка 68). Если selectedResult=null при первом рендере, useMemo не вызывается. При последующем рендере — вызывается. Нарушение Rules of Hooks.

Fix: переместить все хуки ДО early return.

#### 5. ❌ useMemo зависит от локального массива (client/src/components/TagComparison.tsx:86)
useMemo зависит от `fields`, который создаётся заново каждый рендер. Memo бесполезен.

Fix: либо вынести fields в отдельный useMemo, либо передать зависимости напрямую.

#### 6. Stale closure в handleFolderSelect (client/src/hooks/useAppContext.tsx:336,341)
handleFolderSelect вызывает handleSearch, но handleSearch не в deps массиве.

Fix: добавить handleSearch в deps, или использовать ref.

#### 7. ❌ saveConfig без fetchLibrary в deps (client/src/hooks/useAppContext.tsx:308)
saveConfig вызывает fetchLibrary(), но fetchLibrary не в deps.

Fix: добавить fetchLibrary в deps.

#### 8. Browser race condition при disconnect (server/src/scraper.ts:189-241)
Если disconnected событие fired пока browserLaunchPromise active — старый промис резолвится с утёкшим браузером.

Fix: сбрасывать browserLaunchPromise только в finally, обрабатывать disconnect для отмены pending launch.

#### 9. Нет error handling в getTags при битых MP3 (server/src/tagger.ts:47,87,107)
NodeID3.read() бросает на битых файлах — крашит весь getTags().

Fix: обернуть каждый readTags() в try/catch, логировать, пропускать битый файл.

### Low

#### 10. console.log вместо logger в scraper.ts (server/src/scraper.ts:218,228,247,251,259,279)
Шесть вызовов console.log вместо logger в функции ensureBrowser().

Fix: заменить на logger.info().

#### 11. ❌ abortControllerRef не используется (client/src/hooks/useAppContext.tsx:264)
Объявлен но нигде не читается/пишется.

Fix: удалить.

#### 12. ❌ fs.rmdir deprecated (server/src/tagWriter.ts:313)
fs.rmdir() deprecated с Node.js 16. Использовать fs.rm().

Fix: заменить на fs.rm(dir).

#### 13. headless: false (server/src/scraper.ts:229)
Не работает без дисплея (CI/Docker).

Fix: сделать конфигурируемым, default true в production.

#### 14. any типы в tagWriter.ts (server/src/tagWriter.ts:71,118-120)
updatedTags: any, writeUserDefinedText parameters: any[].

Fix: определить корректные типы или использовать NodeID3.Tags.

#### 15. ❌ config.json vs config.ts DEFAULTS расхождение
config.json: musicRoot=`m:\soulsync`, port=3000, outputFolder=`tag`, outputMode=subfolder
config.ts DEFAULTS: musicRoot=`c:\vibecode\dgc2tag\test_muz`, port=3001, outputFolder=`dgc`, outputMode=subfolder

Fix: привести config.ts DEFAULTS к реальным значениям из config.json.

---

## Поддержка форматов

### Расширение поддержки аудиоформатов
Сканнер (`scanner.ts:21`) уже определяет `.mp3`, `.flac`, `.m4a`, `.ogg`, `.wav`, `.wma`, `.aac`. Но tag reading/writing работает ТОЛЬКО с MP3.

**Что нужно:**
- `tagger.ts:54` — `.endsWith('.mp3')` → поддержать FLAC, M4A, OGG, AAC
- `tagWriter.ts:45,157` — аналогично
- `index.ts:196,218,261` — аналогично
- Нужна библиотека для чтения/записи тегов в других форматах:
  - FLAC: `flac-metadata` или `metaflac`
  - M4A/AAC: `mp4box` или `atomic-parsley`
  - OGG: `ogg-metadata`
  - Или: `music-metadata` (универсальная, поддерживает все форматы) — уже установлена в проекте!
- UI: показывать формат в TagComparison (MP3/FLAC/M4A)

**Приоритет:** Средний — MP3 основной формат для DGC, но FLAC популярен среди коллекционеров.

---

## Сетевая совместимость (Samba / Windows UNC)

### UNC пути (`\\server\share\folder`)
Код использует `path.resolve()` и `path.join()` — Node.js поддерживает UNC на Windows. Но есть проблемы:

**Потенциальные баги:**
1. **Path traversal check** (`index.ts:122,141,190`):
   ```ts
   if (!absolutePath.startsWith(path.resolve(cfg.musicRoot)))
   ```
   - UNC пути могут иметь разный регистр (`\\SERVER\share` vs `\\server\share`)
   - `path.resolve()` не нормализует регистр на Windows
   - **Fix:** использовать `path.resolve().toLowerCase()` для сравнения

2. **fs.realpath() в scanner.ts:55**:
   - Может не работать с сетевыми путями (зависит от монтирования)
   - **Fix:** catch и fallback на исходный путь (уже есть)

3. **fs.rename() в tagWriter.ts:202**:
   - Не работает через сеть (cross-device rename)
   - **Fix:** fallback на copy+delete (уже есть в moveProcessedFiles)

4. **Путь конфигурации** (`config.ts:57`):
   ```ts
   musicRoot: 'c:\\vibecode\\dgc2tag\\test_muz'
   ```
   - hardcoded Windows путь в DEFAULTS
   - **Fix:** использовать относительные пути или env variables

5. **Символы в именах файлов** (`tagWriter.ts:304`):
   ```ts
   name.replace(/[<>:"/\\|?*]/g, '_')
   ```
   - UNC пути содержат `\` — sanitize может сломать путь
   - **Fix:** sanitize применяется только к имени файла/папки, не к полному пути

**Рекомендации:**
- Добавить тест с UNC путями в config
- Документировать поддержку сетевых путей
- Добавить warning в UI при UNC путях (медленные операции)

---

## Новые источники данных

### Spotify — поиск альбомов
Добавить Spotify как источник поиска.
- Требуется Spotify Web API (client credentials flow)
- Эндпоинт: `GET /v1/search?type=album&q=...`
- Требуется регистрация приложения + client_id/client_secret в config
- Клиент: `SpotifySearchResult` тип

### Bandcamp — теги и дискография
Исследовать Bandcamp как источник:
- Теги: artist, album, year, genre, tracks
- Дискография: список альбомов артиста
- Проблема: нет публичного API, нужен скрапинг (Puppeteer)
- Проверить: robots.txt, структура HTML, стабильность верстки

### Дискография артиста — проверка наличия альбомов
Парсить дискографию артиста из всех источников и показывать какие альбомы есть/нет в локальной библиотеке.
- Источники: DGC (band page), Deezer (artist albums), MusicBrainz (artist releases), Spotify
- Сравнение: по имени альбома + году (fuzzy matching)
- UI: отдельная панель "DISCOGRAPHY" с пометками ✓ есть / ✗ нет
- Действие: клик по отсутствующему альбому → поиск на DGC/Deezer

---

## Реализованные фичи

### ✅ Compilation mode: парсинг треклистов сборников
Посты типа https://deathgrind.club/posts/25950 (VA сборники) теперь парсятся корректно.
- Сервер: авто-детект VA в scraper.ts, `compilation?: boolean` на result
- Клиент: types.ts — `compilation?: boolean` на SearchResult и DeezerSearchResult
- Клиент: useAppContext.tsx — `compilation` state, `SET_COMPILATION` action
- Клиент: TrackMatcher.tsx — тогл "Compilation (multi-artist)" в шапке TRACKS панели
- Сервер: scraper.ts — парсинг треклиста split на " - " для artist/title при compilation

### ✅ Панели всегда видны (2024-06-22)
TAG COMPARISON и TRACKS показываются при выборе папки с MP3, даже без найденного релиза.
- Local tags становятся source для редактирования
- TrackMatcher генерирует parsedTracks из localTags.files/trackTitles
- ApplyPanel работает в любом режиме

### ✅ Сохранение тегов при переключении источника (2024-06-22)
При переключении DGC ↔ Deezer:
- postId/deezerId всегда сохраняются
- country, label, releaseType: fallback на localTagValue
- ClearSelectionState сбрасывает selectedDeezer и tagEnabled

### ✅ ID строка в TagComparison (2024-06-22)
Строка ID разделена пополам: DGC ID + Deezer ID из локальных тегов.

### ✅ MusicBrainz как третий источник поиска
Полная интеграция MusicBrainz API:
- Сервер: `musicbrainz.ts` — search + getRelease с rate limiting (1 req/sec)
- Сервер: `sources/musicbrainz.ts` — обёртка SearchSource
- Клиент: `MusicBrainzResults.tsx` — UI результатов (оранжевый #f97316)
- Клиент: `useAppContext.tsx` — handleSelectMbrainz с фоновой загрузкой details
- Сервер: `tagWriter.ts` — запись MusicBrainz тегов (MusicBrainz Album Id, Artist Id, Release Group Id, CATALOGNUMBER, DISCID, originalyear)
- FIELD_MAP — динамическое извлечение всех полей MB API в extraTags
- Клиент: `types.ts` — musicbrainzReleaseId, musicbrainzArtistId, catalogNumber, discId, originalYear в SearchResult

### ✅ Lazy load дерева библиотеки
Дерево загружается рекурсивно с ограничением глубины, дети директорий подгружаются по требованию через `/api/library/children`.
