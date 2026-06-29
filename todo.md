# TODO

## ✅ Исправлено в этой сессии

- **B1.** `TagDefaults` interface — добавлен `postId`, синхронизирован UI, дефолты, JSON
- **B2.** Расхождение портов — Vite proxy: `3001`→`3000`, `.env.example` дополнен
- **B3.** `cross-env` — установлен, `npm start` кроссплатформенный
- **B4.** `todo.md` не существовал — создан
- **C1.** Stale build artifacts — удалены 30+ файлов из `server/src/`
- **C2.** CSS inline cleanup — все статические `style={}` заменены на классы (осталось 6 динамических)
- **C3.** Пустая `client/src/assets/` — зафиксировано в README
- **C4.** `build.ts` — отображается в футере как `b{BUILD}`
- **README.md** — обновлены structure, features, api, notes, добавлена секция Contributing

## 🧪 Тесты — план (на обдумывание)

### Инфраструктура

- Установить `vitest` в корневой `package.json`
- Скрипты: `"test": "vitest run"`, `"test:watch": "vitest"`
- `vitest.config.ts` в корне (workspace-режим, client + server)

### Фикстуры: `tests/fixtures/`

MP3-файлы с известными ID3-тегами. Варианты:
1. Сгенерировать скриптом через `ffmpeg -f lavfi -i anullsrc=...` + `node-id3`
2. Взять реальные альбомы из `tag/` (пользовательские данные, покрывают реальные кейсы)

Нужны наборы:
- `simple/` — база без тегов (`01.mp3`, `02.mp3`)
- `tagged/` — с заполненными ID3 (artist, album, year, genre, trackTitles)
- `compilation/` — multi-artist (разные `TPE1` на каждый трек)
- `mixed-names/` — имена файлов не совпадают с ID3-title
- `no-tags/` — MP3 без каких-либо тегов

### Сквозной тест: `tests/pipeline.test.ts`

Полный цикл работы — защита от LLM-подгонки, т.к. round-trip:

```
tempDir → scanner.getLibraryTree → tagger.getTags
       → matchTracks (со всеми флагами)
       → tagWriter.writeTags → tagger.getTags (проверка round-trip)
       → tagWriter.renameFilesInPlace (проверка переименования)
       → tagWriter.moveProcessedFiles (проверка перемещения)
```

### Тесты matching + parser: `tests/trackMatching.test.ts`

Интеграционные тесты `parseFilename`, `parseCompilationTracklist`, `matchTracks`:

- `filenameMode: 'id3'` vs `'filename'`
- `matchByFilename: true/false`
- compilation (multi-artist треклист)
- strip parentheses в названиях
- exact match, fuzzy (90%+), number mismatch, unmatched
- empty remote / empty local
- **Регрессионные кейсы** — те треклисты, под которые правился парсер

### Server-тесты: `tests/trackUtils.test.ts`

- `isInsideMusicRoot` — win/linux пути, граничные случаи
- `extractTrackNumber` — ID3 `track`, `trackNumber`, `/` total, filename fallback

### LLM-протекция

- Никаких snapshot-тестов — только `toBe`, `toEqual`, `toContain`, `.length`
- Round-trip: записали → прочитали → сравнили (LLM не подгонит, не зная данных)
- Инварианты: после rename/move количество файлов не меняется
- Фикстуры в репозитории — тест падает если данные не совпадают

## 🔜 На потом

- **I1.** GenreCloud — топ-60 жанров, нет поиска (пока не критично)
- **I2.** MusicBrainz — нет retry/backoff при rate limit
- **I3.** Puppeteer recovery — при падении браузера нет автоперезапуска
- **I5.** CI/CD — нет `.github/workflows/`
