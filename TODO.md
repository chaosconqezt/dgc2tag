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

#### 10. console.log вместо logger в scraper.ts (server/src/scraper.ts:191,200,219,234)
Четыре вызова console.log вместо logger.

Fix: заменить на logger.info().

#### 11. ❌ abortControllerRef не используется (client/src/hooks/useAppContext.tsx:244)
Объявлен но нигде не читается/пишется.

Fix: удалить.

#### 12. ❌ fs.rmdir deprecated (server/src/tagWriter.ts:311)
fs.rmdir() deprecated с Node.js 16. Использовать fs.rm().

Fix: заменить на fs.rm(dir).

#### 13. headless: false (server/src/scraper.ts:202)
Не работает без дисплея (CI/Docker).

Fix: сделать конфигурируемым, default true в production.

#### 14. any типы в tagWriter.ts (server/src/tagWriter.ts:80,116,121)
updatedTags: any, writeUserDefinedText parameters: any[].

Fix: определить корректные типы или использовать NodeID3.Tags.

#### 15. ❌ config.json vs config.ts DEFAULTS расхождение
config.json: musicRoot=c:\vibecode\dgc2tag\music, port=3000, outputFolder=c:\vibecode\dgc2tag\music_processed, outputMode=absolute
config.ts DEFAULTS: musicRoot=test_muz, port=3001, outputFolder=dgc, outputMode=subfolder

Fix: привести config.ts DEFAULTS к реальным значениям из config.json.

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
