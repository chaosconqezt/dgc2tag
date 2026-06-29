# CSS: Переход с inline styles → index.css

## Цель

Убрать все `style={{...}}` из JSX, заменив на CSS-классы из `index.css`.
Финально: удалить `client/src/components/styles.ts`.
Палитра, шрифт и размер текста задаются в `:root` — одна строка меняет всё.

## Архитектура

- **CSS-переменные** в `:root` (цвета, шрифт, размеры)
- **CSS-классы** для layout (`.row`, `.col`, `.gap-*`, `.p-*`)
- **data-атрибуты** для динамических стилей (`.tag-input[data-diff="true"]`)
- **CSS Custom Properties** для акцентных цветов по `style={{ '--accent': ... }}`

## ⚠️ Критические правила

1. **Никогда** не трогать `value`, `onChange`, `onBlur`, `onKeyDown`, `readOnly`, `disabled`, `checked`
2. **Никогда** не добавлять `pointer-events: none` — если нужен readonly, есть проп `readOnly`
3. **Никогда** не менять вложенность DOM вокруг `<input>` или `<button>`
4. После замены каждого компонента — проверить его функциональность
5. **Не менять больше одной группы за раз**

## ⚠️ Таблица: единый стиль + осторожность с полями ввода

**Проблема:** TagComparison (59 inline) и TrackMatcher (30 inline) — это таблицы с полями ввода. Они должны быть в едином стиле. Но поля ввода могут сломаться при неаккуратной замене.

**Подход:**
1. **Сначала набросать прототип таблицы** — отдельный HTML/CSS файл со всеми вариациями полей (текст, число, readonly, diff, enabled/disabled). Отработать визуал ДО применения к реальным компонентам.
2. **Затем применять** к TagComparison и TrackMatcher, сверяя с прототипом.

**Что должно быть в прототипе таблицы:**
- Базовая строка: лейбл + поле ввода + кнопка
- Состояния поля: обычное, focused, diff (жёлтая рамка), readonly (приглушённое)
- Строка с чекбоксом enabled/disabled
- Группа строк (секция) с заголовком
- Строка с multiline textarea (Extra Tags)
- Акцентная рамка для selected/active строки
- Строка с иконкой действия

**Ключевые CSS-классы для таблицы:**
```css
.table-row           /* базовая строка: flex, gap, align-items */
.table-row[data-enabled="false"] { opacity: 0.5; }
.table-cell          /* ячейка: flex:1, min-width:0 */
.table-label         /* лейбл: ширина, color:text-dim, nowrap */
.table-input         /* поле ввода: базовый стиль */
.table-input[data-diff="true"] { border-color: var(--yellow); }
.table-input[data-readonly="true"] { opacity: 0.6; cursor: default; }
.table-section-header /* заголовок секции: uppercase, bold */
.table-actions       /* кнопки действий: flex, gap */
```

## Логика таблиц: данные и зависимости

### TagComparison — панель TAGS (файл vs каталог)

**Входные данные:**
- `localTags: AlbumTags` — теги из файла (artist, album, year, genre, country, label, releaseType, extraTags)
- `selectedResult: SearchResult` — результат поиска (artist, albumName, year, genres, country, label, releaseType, extraTags)
- `tagEnabled: Record<string, boolean>` — какие теги включены для записи
- `editedSiteValues: Record<string, string>` — редактированные пользователем значения каталога
- `editedExtraTags: Record<string, string>` — редактированные extra tags

**Сетка (grid):** `11px 1fr 40px 1fr` — чекбокс | FILE значение | % схожести | CATALOG input

**Для каждого поля (artist, albumArtist, album, year, genre, country, label, releaseType):**
1. **Чекбокс** — `checked={enabled}`, `disabled={readonly}`, `onChange → onTagEnabledChange`
2. **FILE ячейка** — `renderLocalValue(file, key)`, лейбл поля справа
3. **% схожести** — `fieldSims[key]`, вычисляется через `similarity()`
4. **CATALOG input** — `value={siteVal}`, `onChange → onEditedSiteValuesChange`
   - Динамические стили: `color` (green если differs, muted если нет), `backgroundColor` (greenBg/inputBg), `border` (greenBorder/borderLight), `fontWeight` (600/400)

**IDs строка (DGC + Deezer):** readonly, показывает postId/deezerId из файла и каталога

**Extra Tags секция:** раскрывающаяся, grid `1fr 1fr 1fr` (Tag | Current | New), input для каждого тега

### TrackMatcher — панель TRACKS (матчинг треков)

**Входные данные:**
- `albumDetails: SearchResult` — содержит `parsedTracks` или `tracklist`
- `localTags: AlbumTags` — содержит `files[]`, `trackTitles`, `trackDurations`
- `writeTrackNames / writeTrackArtists` — глобальные тоглы
- `trackNameEnabled / trackArtistsEnabled` — per-track вкл/выкл
- `editedTrackNames / editedTrackArtists` — редактированные значения

**Toolbar:** чекбоксы (write track titles, filenames, multi-artist, strip parens, artists), радио (ID3/filename), статистика (exact/close/missing/extra)

**Два режима:**
- **SingleArtistTracks** — простой список MatchRow
- **MultiArtistTracks** — MatchRow + TrackArtistField под каждым треком

### MatchRow — строка трека

**Сетка:** чекбокс | локальный трек | длительность | % | удалённая длительность | edit input

**Данные:**
- `m.remote` — { num, artist, name, duration } из каталога
- `m.local` — { num, name, file } из файла (или null если не найден)
- `m.sim` — 0-100% схожесть
- `m.numberMismatch` — номер трека не совпадает

**Edit input:**
- `value={displayName}` — editedTrackNames[num] или remote.name
- `onChange → onEditedTrackNameChange` + auto-enable if was disabled
- Динамические стили: `color` (red=unmatched, green=edited, yellow=differs, muted=same), `backgroundColor`, `border`, `fontWeight`

### TrackArtistField — inline редактирование артиста

**Состояния:**
- **Display:** span с `onClick → setEditing(true)`, показывает value или "—"
- **Edit:** input с `onBlur → onChange` (если changed), `onKeyDown Enter/Escape`
- **Цвет:** `enabled ? textMuted : textFaint`

### simColor → CSS

`simColor(sim)` → `green` (100%), `yellow` (80-99%), `red` (<80%)
Используется в MatchRow и MultiArtistTracks для цвета % и имени трека.

## Правило сброса шрифта

Все поля наследуют `font-family: var(--font)` и `font-size: var(--fs)` от `body`.
Явные `fontFamily: FONT` и `fontSize: FS` в inline стилях — **удалить** (избыточны).
Оставить только `font-size` отличный от дефолта (FS_S=12px, FS_SM=11px, FS_XS=10px) и `font-family: monospace` где нужно.

## Порядок переноса

### Группа 1: Сайдбар ✅
- [x] **1.0** — index.css: фундамент (переменные, body, input наследование)
- [x] **1.1** — index.css: классы сайдбара (`.sidebar-inner`, `.sidebar-header`, `.sidebar-title`, `.sidebar-actions`, `.sidebar-tree-wrap`, `.sidebar-results`)
- [x] **1.2** — index.css: resize-хендлы (`.resize-h`, `.resize-v`)
- [x] **1.3** — index.css: кнопки (`.btn-icon`)
- [x] **1.4** — index.css: дерево (`.tree-container`, `.tree-item`, `.tree-arrow`, `.tree-bullet`, `.tree-item-text`, `.tree-badge`, `.tree-children`, `.tree-input`, `.tree-loading`)
- [x] **1.5** — index.css: MoveDialog (`.move-overlay`, `.move-panel`, `.move-header`, `.move-search`, `.move-list`, `.move-item`, `.move-empty`, `.move-footer`, `.move-cancel`)
- [x] **1.6** — App.tsx: замена inline в сайдбар-секции
- [x] **1.7** — LibraryTree.tsx: замена inline
- [x] **1.8** — MoveDialog.tsx: замена inline

### Группа 2: Библиотека ✅
- [x] **2.1** — index.css: все шрифты/цвета галереи → наследуют body
- [x] **2.2** — index.css: чистка карточек
- [x] **2.3** — index.css: удалена галка
- [x] **2.4** — LibraryView.tsx: удалена галка из DOM
- [x] **2.5** — index.css: genre-tag cleanup
- [x] **2.6** — index.css: `--card-bg` удалён

### База (общее) ✅
- [x] `--fw`, `--fw-bold`, `--gap-*`, `--font-mono` в `:root`
- [x] `body`: font-weight, letter-spacing, font-stretch
- [x] `--accent` единый акцентный цвет

### Группа 3: Карточки поиска ✅
- [x] **3.1** — index.css: классы карточек
- [x] **3.2** — ResultCard.tsx: замена inline (3 динамических остались — accent color, ОК)
- [x] **3.3** — styles.ts: починены сломанные ссылки на CSS-переменные

### Группа 4: Простые компоненты
- [x] **4.1** — index.css: утилиты (`.row`, `.col`, `.gap-*`, `.p-*`, `.mb-*`, `.flex-1`, `.shrink-0`)
- [x] **4.2** — index.css: панели (`.panel`, `.cell`, `.percent`, `.label-uppercase`, `.hint`, `.cb`)
- [x] **4.3** — SearchResults.tsx (15 inline → 0)
- [x] **4.4** — SearchBar.tsx (10 inline → 0, мёртвые импорты удалены)
- [x] **4.5** — Footer.tsx (15 inline → 0)
- [x] **4.6** — FolderPicker.tsx (18 inline → 0)
- [x] **4.7** — SingleArtistTracks.tsx (включая simColor → CSS)
- [x] **4.8** — TrackArtistField.tsx (3 inline → CSS)
- [x] **4.9** — ApplyPanel.tsx (5 inline → 2, остатки через CSS)
- [x] **4.10** — ErrorBoundary.tsx (5 inline → 0)
- [x] **4.11** — ContextMenu.tsx (2 inline → 0)
- [x] **4.12** — WebfetchOverlay.tsx (11 inline → 0)

### Группа 5: simColor → CSS-классы ✅
- [x] **5.1** — index.css: `.sim-high`, `.sim-mid`, `.sim-low`
- [x] **5.2** — MatchRow.tsx: `simColor` → CSS переменные
- [x] **5.3** — SingleArtistTracks.tsx: `simColor` → CSS переменные
- [x] **5.4** — MultiArtistTracks.tsx: `simColor` → CSS переменные

### Группа 6: TagComparison.tsx (data-атрибуты) — 59 inline ✅
> ⚠️ Это таблица с полями ввода. Сначала нужен прототип таблицы (см. "Таблица: единый стиль" выше). Не трогать value/onChange/onKeyDown.

- [x] **6.0** — Прототип таблицы: HTML-файл со всеми вариациями полей, отработать визуал
- [x] **6.1** — index.css: `.tc-*` классы, data-атрибуты
- [x] **6.2** — TagComparison.tsx: замена 59 inline, шрифт сброшен на дефолт

### Группа 7: MatchRow.tsx (data-атрибуты) — 16 inline ✅
> ⚠️ Это строка таблицы с полем ввода названия трека. Тот же стиль что Group 6.

- [x] **7.1** — index.css: `.mr-*` классы, data-атрибуты
- [x] **7.2** — MatchRow.tsx: замена 16 inline, шрифт сброшен на дефолт

### Группа 8: MultiArtistTracks.tsx — 12 inline ✅
- [x] **8.1** — MultiArtistTracks.tsx: замена 12 inline

### Группа 9: SettingsModal.tsx — 30 inline ✅
- [x] **9.1** — SettingsModal.tsx: замена 30 inline, импорт из styles.ts удалён

### Группа 10: App.tsx (остатки) ✅
- [x] **10.1** — App.tsx: замена оставшихся inline (15→3), импорт из styles.ts удалён

### Группа 11: TrackMatcher.tsx — 30 inline ✅
> ⚠️ Это таблица треков с полями ввода. Тот же стиль что Group 6. Сначала прототип.

- [x] **11.0** — Убедиться что прототип таблицы (6.0) покрывает все состояния TrackMatcher
- [x] **11.1** — TrackMatcher.tsx: замена 30 inline, шрифт сброшен на дефолт

### Финально
- [x] **12.0** — Удалён `client/src/components/styles.ts` ✅
- [x] **12.1** — Убраны все импорты из `'./styles'`
- [x] **🔴 Регрессия**: всё работает ✅

---

## Аудит: оставшиеся inline styles (по файлам)

| Файл | Inline | Импорт styles | Статус |
|------|--------|---------------|--------|
| SettingsModal.tsx | 0 | Нет | ✅ Группа 9 |
| App.tsx | 3 | Нет | ✅ Группа 10 |
| ResultModal.tsx | 1 | Нет | ✅ (width) |
| ApplyPanel.tsx | 2 | Нет | ✅ Базовые динамические |
| FolderPicker.tsx | 0 | Нет | ✅ Группа 4.6 |
| Footer.tsx | 0 | Нет | ✅ Группа 4.5 |
| SearchResults.tsx | 0 | Нет | ✅ Группа 4.3 |
| WebfetchOverlay.tsx | 0 | Нет | ✅ Группа 4.12 |
| ErrorBoundary.tsx | 0 | Нет | ✅ Группа 4.10 |
| ContextMenu.tsx | 0 | Нет | ✅ Группа 4.11 |
| TagComparison.tsx | 8 | Нет | ✅ Группа 6 |
| TrackMatcher.tsx | 0 | Нет | ✅ Группа 11 |
| MatchRow.tsx | 1 | Нет | ✅ Динамические |
| MultiArtistTracks.tsx | 1 | Нет | ✅ Динамические |
| ResultCard.tsx | 3 | Нет | ✅ Динамические (accent) |
| LibraryTree.tsx | 2 | Нет | ✅ Динамические (indent) |
| LibraryView.tsx | 1 | Нет | ✅ Динамические (card size) |
| GenreCloud.tsx | 1 | Нет | ✅ Динамические (weight) |
| ProgressOverlay.tsx | 1 | Нет | ✅ Динамические |

**Итого: ~3 inline styles в 1 файле (App.tsx: sidebarWidth, treeHeightPx, marginBottom: '6px'). Остальные — только динамические.**

---

## Оптимизация CSS: план

### Цель
Минималистичный CSS с простой настройкой вида. Вся кастомизация — в `:root`. Удалить `styles.ts`, убрать все inline styles, почистить дубли.

### Что нужно сделать

#### Фаза 1: Чистка index.css ✅ (всё сделано в процессе миграции)
- [x] **O.1-9** — Уже почищено: дубликатов нет, пустых правил нет, `box-sizing` в `.result-card` нет, `body` без `letter-spacing/font-stretch`, `:focus-visible` одно, `appearance: none` только на `.tc-input`/`.mr-track-input` (нужен), `hover-red`/`hover-toolbar` оставлены (3 использования)
- [x] **O.24** — Удалены мёртвые `--tracking` и `--stretch` из `:root`

#### Фаза 2: styles.ts → CSS классы (группы по приоритету)
- [x] **O.10** — App.tsx (15 inline): 3 полных дубля `.main-content`, `.bottom-panels`, `.diff-panel` → удалить inline, оставить только className. Остальные 12 → CSS-классы
- [ ] **O.11** — SettingsModal.tsx (20 inline): заменить `OVERLAY_BACKDROP`, `MODAL_PANEL`, `MODAL_HEADER`, `LABEL_STYLE`, `MODAL_INPUT_STYLE`, `HINT_STYLE`, `ICON_BUTTON` → CSS-классы `.modal-overlay`, `.modal-panel`, `.modal-header`, `.modal-label`, `.modal-input`, `.modal-hint`
- [ ] **O.12** — FolderPicker.tsx (16 inline): те же overlay/modal классы + `.folder-picker-*`
- [ ] **O.13** — Footer.tsx (15 inline): `.footer-*` классы
- [ ] **O.14** — SearchResults.tsx (14 inline): `.search-results-*` классы
- [ ] **O.15** — WebfetchOverlay.tsx (9 inline): overlay/modal классы
- [ ] **O.16** — ErrorBoundary.tsx (5 inline): `.error-fallback`, `.error-icon`, `.error-title`, `.error-msg`, `.error-reload` — уже есть в index.css, просто переключить
- [ ] **O.17** — ResultModal.tsx (5 inline): overlay/modal классы
- [ ] **O.18** — ContextMenu.tsx (1 inline): `.ctx-menu` уже есть, остаток один inline
- [ ] **O.19** — Удалить 43 лишних `fontFamily: FONT` из всех файлов — body наследует

#### Фаза 3: Удаление styles.ts
- [ ] **O.20** — Удалить мёртвые экспорт: `FS_L`, `CHECKBOX`, `CELL_STYLE`, `INPUT_STYLE`, `PERCENT_STYLE`, `simColor`, `GRID_STYLE`, `ROW_STYLE`
- [ ] **O.21** — Удалить `client/src/components/styles.ts`
- [ ] **O.22** — Убрать `import { ... } from './styles'` из всех 12 файлов

#### Фаза 4: Упрощение :root
- [ ] **O.23** — Сгруппировать цвета: убрать `--green-bg`, `--green-border`, `--purple-bg`, `--purple-border` (не используются в CSS, только в styles.ts)
- [ ] **O.24** — Убрать `--tracking` и `--stretch` из `:root` (нестандартные, нигде не нужны)
- [x] **O.25** — Добавлены `--radius-sm: 3px`, `--radius: 6px`, `--radius-lg: 10px`. Заменены 30 hardcoded значений (3px/6px/10px). 4px/5px/8px оставлены явно (по 1-11 использований, менять рискованно)

#### Фаза 5: Проверка ✅
- [x] **🔴 Регрессия**: всё работает ✅

### Порядок выполнения
Фазу 1 (чистка CSS) — делать первой, она безопасна. Фазу 2 — по одному файлу, проверяя каждый. Фазу 3 — только после фазы 2. Фазу 4 — опциональная, только если хочется进一步 упрощения.
