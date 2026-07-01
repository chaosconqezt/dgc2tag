# TODO

## 📐 План рефакторинга UI — новый минимальный CSS + чистые компоненты

### Идея
Визуал остаётся тот же (чёрный, красный акцент, Inter, плотная вёрстка), но весь CSS переписывается в ~300 строк с единой атомарной системой (`.panel`, `.input`, `.btn`, `.row`, `.col`). Компоненты переписываются по одному, используют только атомарные классы + свой минимум кастомного layout. Старые файлы удаляются после замены.

### Этапы

#### Шаг 0. Подготовка
- [ ] Создать `client/src/components-new/`
- [ ] Создать `client/src/index-new.css`
- [ ] `App.tsx` подключает `index-new.css` вместо `index.css`
- [ ] Оба набора компонентов живут параллельно, переключение через реэкспорт в `App.tsx`

#### Шаг 1. CSS-архитектура (~300 строк)
- [ ] :root — 10–12 переменных (bg, surface, border, text, accent, зеленый, шрифты, размеры)
- [ ] Reset (box-sizing, body, наследование шрифта)
- [ ] Layout (dashboard — grid 2 колонки, main-content — flex column)
- [ ] Atoms: `.panel`, `.input`, `.btn`, `.badge`, `.label`
- [ ] Utilities: `.text-ellipsis`, `.row`, `.col`, `.gap-*`, `.flex-1`
- [ ] Sidebar layout

#### Шаг 2. Новый layout App.tsx
- [ ] Разметка dashboard: sidebar | main (grid или flex)
- [ ] Sidebar: header + tree-wrap + results (flex column)
- [ ] Main: scrollable content + footer
- [ ] Resize handle

#### Шаг 3. Footer
- [ ] `components-new/Footer.tsx`
- [ ] Только атомарные классы + layout `footer-bar`

#### Шаг 4. SearchBar
- [ ] `components-new/SearchBar.tsx`
- [ ] `input`, `.btn` — без кастомных классов поиска

#### Шаг 5. ApplyPanel
- [ ] `components-new/ApplyPanel.tsx`
- [ ] Кнопки: `.btn-write`, `.btn-rename`, `.btn-move`, `.btn-cancel` — только цвет фона, всё остальное от `.btn`

#### Шаг 6. TreeView (LibraryTree)
- [ ] `components-new/TreeView.tsx` — контейнер
- [ ] `components-new/TreeItem.tsx` — строка дерева (React.memo)
- [ ] CSS-indent через `--depth` вместо inline style
- [ ] Один обход дерева вместо трёх `useMemo`
- [ ] Rename inline editing внутри TreeItem
- [ ] ContextMenu + MoveDialog
- [ ] CSS (`.tree-item`, `.tree-arrow`, `.tree-badge`) — ~25 строк

#### Шаг 7. SearchResults
- [ ] `components-new/SearchResults.tsx`
- [ ] Список результатов с иконками источников
- [ ] Выделение, подгрузка

#### Шаг 8. TagComparison
- [ ] `components-new/TagComparison.tsx`
- [ ] Самая сложная панель, переписать аккуратно
- [ ] ExtraTags
- [ ] SimPercent — атомарный

#### Шаг 9. TrackMatcher + MatchRow
- [ ] `components-new/TrackMatcher.tsx`
- [ ] `components-new/MatchRow.tsx` — чистая сетка без `mr-*` дублей
- [ ] `MultiArtistTracks` / `SingleArtistTracks` — опционально объединить
- [ ] `TrackArtistField`

#### Шаг 10. Модалки
- [ ] `components-new/SettingsModal.tsx`
- [ ] `components-new/ResultModal.tsx`
- [ ] `components-new/ProgressOverlay.tsx`
- [ ] Общий `.modal-overlay` + `.modal-panel` в CSS

#### Шаг 11. Cleanup
- [ ] Удалить `client/src/components/`
- [ ] Удалить `client/src/index.css`
- [ ] Переименовать `index-new.css` → `index.css`
- [ ] Переименовать `components-new/` → `components/`
- [ ] Проверить, что `AUDIT.md`/todo не ссылаются на старые файлы

### Принципы нового CSS
- **Никаких дублей.** Один `.input` на все поля ввода, один `.btn` на все кнопки.
- **Минимум кастомных классов.** Только уникальный layout (например, `.tc-grid` — 4-колоночная сетка).
- **10 переменных в :root.** Смена `--bg` и `--accent` перекрашивает всё.
- **Утилиты.** `.row`, `.col`, `.gap-sm`, `.flex-1` — без кастомных flex-свойств в каждом компоненте.
- **Modifier через data-атрибуты.** `data-selected`, `data-open` — без `.sel`, `.open`.

### Порядок компонентов (от простого к сложному)
1. Footer (~30 строк)
2. SearchBar (~50 строк)
3. ApplyPanel (~30 строк)
4. TreeView (~100 строк + TreeItem)
5. SearchResults (~80 строк)
6. TrackMatcher (~150 строк + MatchRow)
7. TagComparison (~200 строк)
8. SettingsModal (~80 строк)
9. ResultModal (~80 строк)
10. ProgressOverlay (~50 строк)

---

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
