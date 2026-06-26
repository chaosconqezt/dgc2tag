# TODO — Code Review Fixes

> **Важно:** исправлять строго по одному пункту за раз. После каждого пункта — показать что изменилось и дождаться подтверждения перед следующим.

## P0 — Критично (краш/баг данных)

- [x] 1. `server/src/index.ts:64-85` — обернуть async-обработчики POST /api/config и роуты конфига в try/catch
- [x] 2. `server/src/scraper.ts:157-170` — taxonomyLoaded = true при ошибке fetchTaxonomy чтобы не запускать Puppeteer при каждом запросе
- [x] 3. `server/src/tagWriter.ts:219,252` — moveProcessedFiles возвращает реальные пути вместо заглушек `file_1`
- [x] 4. `client/src/components/TagComparison.tsx:278` — ExtraTagsSection: реальный обработчик вместо `onOutputChange={() => {}}`
- [x] 5. `client/src/components/TrackArtistField.tsx:14` — useEffect для синхронизации draft с пропсом value

## P1 — Важно (безопасность)

- [x] 6. `server/src/trackUtils.ts:7-9` — isInsideMusicRoot: path.sep перед startsWith
- [x] 7. `server/src/scraper.ts:527` — SSRF: redirect: 'manual' в fetchPageContent
- [x] 8. `client/src/components/WebfetchOverlay.tsx:38` — sandbox="" на iframe
- [x] 9. `server/src/index.ts:312` — ограничение размера тела в /api/parse-genres (max 1MB)

## P2 — Высокий приоритет (стабильность)

- [x] 10. `scraper.ts:24,91,307` + `tagWriter.ts:270` + `index.ts:236` — пустые catch {} заменены на логирование
- [x] 11. `server/src/index.ts:64-85` — mutex/lock для config write
- [x] 12. `server/src/scraper.ts:205-289` — ensureBrowser: вынесено в launchBrowser(), промис сохраняется сразу
- [x] 13. `server/src/scanner.ts:68` — readdirSync → async fs.readdir
- [x] 14. `client/src/api.ts:135-172` — SSE updateTags в activeControllers
- [x] 15. прогресс-диспатчи привязаны к lifecycle через AbortController (пункт 14)

## P3 — Средний приоритет (логика/типизация)

- [x] 16. `server/src/deezer.ts:59-122` — rate limiting 120ms между запросами
- [x] 17. `server/src/musicbrainz.ts:122-125` — escapeLucene() для artist/album
- [x] 18. `server/src/types.ts:29` — Id3Tags.track: string | number
- [x] 19. `client/src/hooks/useSearch.ts:157-206` — loadAlbumDetailsIdRef guard для MusicBrainz
- [x] 20. `client/src/hooks/appReducer.ts:185-200` — CLEAR_SELECTION_STATE не очищает searchResults/localTags

## P3.5 — Новые фичи

- [x] 21. Кнопка «Clear all» в ExtraTagsSection с подтверждением через window.confirm

## P4 — Производительность

- [x] 22. `client/src/hooks/useAppContext.tsx:71-78` — контекст в useMemo
- [x] 23. `client/src/components/LibraryTree.tsx:12-29` — countDirs/countAudioFiles через useMemo Map
- [x] 24. `client/src/components/TrackMatcher.tsx:54-57` — matchTracks в useMemo
- [x] 25. `client/src/components/TrackMatcher.tsx:68-76` — batch toggle через SET_TRACK_NAME_ENABLED_BATCH
- [x] 26. `App.tsx:36-61` — resize throttle через requestAnimationFrame
- [x] 27. `client/src/components/ResultCard.tsx:79` — loading="lazy" на img

## P5 — Низкий приоритет (код-квалити)

- [x] 28. `server/src/tagger.ts:33-116,184-215` — два прохода чтения тегов объединены в один
- [x] 29. `server/src/cache.ts:4` — PROJECT_ROOT через import.meta.url
- [x] 30. `client/src/hooks/useWebfetch.ts:7-19` — AbortController для webfetch
- [x] 31. `client/src/hooks/useSearch.ts:78-106` — searchGeneration ref для отмены устаревших результатов
- [x] 32. `api.ts:104,109` — sourceSearch/sourceGetDetails типизированы
- [x] 33. `hooks/appReducer.ts:246` — unknown action логируется в dev
- [x] 34. `App.tsx:96` — .catch() к init()
- [x] 35. `hooks/useTagActions.ts:85` — Deezer определяется по source вместо postId < 0
