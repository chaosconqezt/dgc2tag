# CSS: Переход с inline styles → index.css

> **Это обновлённая версия todo.md** — скопируй содержимое в `todo.md`.

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

---

## Порядок переноса (по приоритету)

### Группа 1: Сайдбар ✅
- [x] **1.0** — index.css: фундамент (переменные, body, input наследование)
- [x] **1.1** — index.css: классы сайдбара
- [x] **1.2** — index.css: resize-хендлы
- [x] **1.3** — index.css: кнопки (`.btn-icon`)
- [x] **1.4** — index.css: дерево
- [x] **1.5** — index.css: MoveDialog
- [x] **1.6** — App.tsx: замена inline в сайдбар-секции
- [x] **1.7** — LibraryTree.tsx: замена inline
- [x] **1.8** — MoveDialog.tsx: замена inline

### Группа 2: Библиотека ✅
- [x] **2.1–2.6** — index.css + LibraryView.tsx + genre-tag

### База (общее) ✅
- [x] `--fw`, `--fw-bold`, `--gap-*`, `--font-mono` в `:root`
- [x] `body`: font-weight, letter-spacing, font-stretch
- [x] `--accent` единый акцентный цвет

### Группа 3: Карточки поиска ✅
- [x] **3.1–3.3** — index.css + ResultCard.tsx + styles.ts

---

## Приоритет A: Утилиты + почти готовые (0-2 inline)

Мелкие правки, дают базу для остальных компонентов.

- [ ] **A.1** — index.css: утилиты (`.row`, `.col`, `.gap-*`, `.flex-1`, `.shrink-0`, `.min-w-0`)
- [ ] **A.2** — index.css: ячейки (`.cell`, `.percent`, `.label-uppercase`, `.hint`)
- [ ] **A.3** — index.css: инпуты (`.input-base`, `.input-diff`, `.input-readonly`)
- [ ] **A.4** — index.css: кнопки (`.btn-go`, `.btn-ok`, `.btn-add`, `.btn-cancel-bordered`)
- [ ] **A.5** — SingleArtistTracks.tsx — **1 inline** (flex column wrapper → `.col`)
- [ ] **A.6** — ApplyPanel.tsx — **2 inline** (container flex + cancel override → `.row` + `.btn-cancel-bordered`)
- [ ] **A.7** — SearchBar.tsx — **0 inline** (уже мигрирован), удалить мёртвые `import { FONT, FS, COLORS }` из styles

## Приоритет B: Лёгкие компоненты (2-5 inline)

- [ ] **B.1** — ContextMenu.tsx — **2 inline** (контейнер позиционируется динамически `left/top` — оставить inline, остальное → классы `.ctx-menu`, `.ctx-item`)
- [ ] **B.2** — TrackArtistField.tsx — **3 inline** (wrapper с conditional `color` по `enabled` — data-атрибут `[data-enabled]`, input и span)
- [ ] **B.3** — ErrorBoundary.tsx — **5 inline** (все в статичном `FALLBACK_CONTENT` — семейство классов `.error-fallback`, `.error-icon`, `.error-title`, `.error-msg`, `.error-reload`)
- [ ] **B.4** — ResultModal.tsx — **5 inline** (уже использует `progress-*` классы, осталось: header flex, console-line marginBottom/fontWeight, footer flex, OK кнопка → `.btn-ok`)

## Приоритет C: Средние компоненты (11-18 inline)

- [ ] **C.1** — index.css: классы модалок (`.modal-overlay`, `.modal-panel`, `.modal-header`, `.modal-body`, `.modal-footer`)
- [ ] **C.2** — WebfetchOverlay.tsx — **11 inline** (shell дублирует progress-overlay → `.modal-*` классы, loading spinner → `.modal-loading`, iframe → `.modal-iframe`)
- [ ] **C.3** — SearchResults.tsx — **15 inline** (header bar → `.results-header`, source badges → `.results-badge[data-source]` с цветами через CSS, count badge → `.results-count`, no-results → `.results-empty`)
- [ ] **C.4** — Footer.tsx — **15 inline** (bar → `.footer-bar`, sections → `.footer-section`, paths → `.footer-path`, separators → `.footer-sep`, mode toggles → `.footer-mode[data-active]`, spacer → `.flex-1`)
- [ ] **C.5** — FolderPicker.tsx — **18 inline** (shell → `.modal-*`, path input → `.picker-path`, Go button → `.btn-go`, error → `.picker-error`, tree → `.picker-tree`, node rows с динамическим `paddingLeft` по `depth` — оставить inline для depth, остальное → `.picker-node[data-selected]`)

## Приоритет D: simColor → CSS

- [ ] **D.1** — index.css: `.sim-high`, `.sim-mid`, `.sim-low`
- [ ] **D.2** — MatchRow.tsx: `simColor` → `data-sim="high|mid|low"` атрибут + CSS
- [ ] **D.3** — SingleArtistTracks.tsx: убрать import `simColor`
- [ ] **D.4** — MultiArtistTracks.tsx: `simColor` → CSS (передаёт в MatchRow через `sc` prop)

## Приоритет E: Тяжёлые компоненты (таблицы)

> ⚠️ **Сначала прототип таблицы (E.0).** Не трогать value/onChange/onKeyDown.

### E.0: Прототип таблицы
- [ ] Создать HTML-файл со всеми вариациями полей
- [ ] Отработать визуал: обычное, focused, diff, readonly, enabled/disabled
- [ ] Секции, multiline textarea, акцентная рамка

### E.1: TagComparison.tsx — 59 inline
- [ ] index.css: `.tc-row`, `.tc-grid`, `.tc-cell`, `.tc-input[data-diff]`, `.tc-input[data-readonly]`, `.tc-percent`, `.tc-id-row`, `.tc-extra-*`
- [ ] TagComparison.tsx: замена 59 inline, сверяя с прототипом

### E.2: MatchRow.tsx — 16 inline
- [ ] index.css: `.mr-row`, `.mr-local`, `.mr-duration`, `.mr-sim`, `.mr-track-input[data-edited]`, `.mr-track-input[data-unmatched]`
- [ ] MatchRow.tsx: замена 16 inline

### E.3: TrackMatcher.tsx — 30 inline
- [ ] index.css: `.tm-toolbar`, `.tm-stat`, `.tm-sep`
- [ ] TrackMatcher.tsx: замена 30 inline

### E.4: MultiArtistTracks.tsx — 12 inline
- [ ] MultiArtistTracks.tsx: замена 12 inline (layout spacers → классы, artist row → `.mr-artist-row`)

## Приоритет F: SettingsModal

- [ ] **F.1** — index.css: `.settings-tag-toggle[data-active]`, `.settings-source-toggle[data-color]`, `.settings-pattern`, `.settings-btn-save`, `.settings-btn-cache`
- [ ] **F.2** — SettingsModal.tsx: замена 30 inline (shell → `.modal-*`, tag grid → `.settings-tag-grid`, source chips → `.settings-source-toggle`, pattern tags → `.settings-pattern`, buttons)

## Приоритет G: App.tsx остатки

- [ ] **G.1** — App.tsx: замена оставшихся inline styles

## Финально

- [ ] **Z.1** — Удалить `client/src/components/styles.ts`
- [ ] **Z.2** — Убрать `import { ... } from './styles'` из всех файлов
- [ ] **🔴 Z.3** — Регрессия: полный проход по всем функциям

---

## Аудит: оставшиеся inline styles (по файлам)

| Файл | Inline | Импорт styles | Приоритет | Статус |
|------|--------|---------------|-----------|--------|
| TagComparison.tsx | 59 | DA | E.1 | ⬜ Таблица |
| TrackMatcher.tsx | 30 | DA | E.3 | ⬜ Таблица |
| SettingsModal.tsx | 30 | DA | F | ⬜ |
| FolderPicker.tsx | 18 | DA | C.5 | ⬜ |
| MatchRow.tsx | 16 | DA | E.2 | ⬜ Таблица |
| Footer.tsx | 15 | DA | C.4 | ⬜ |
| SearchResults.tsx | 15 | DA | C.3 | ⬜ |
| MultiArtistTracks.tsx | 12 | DA | E.4 | ⬜ Таблица |
| WebfetchOverlay.tsx | 11 | DA | C.2 | ⬜ |
| ErrorBoundary.tsx | 5 | DA | B.3 | ⬜ |
| ResultModal.tsx | 5 | Нет | B.4 | ⬜ |
| ApplyPanel.tsx | 2 | DA | A.6 | ⬜ |
| TrackArtistField.tsx | 3 | DA | B.2 | ⬜ |
| ContextMenu.tsx | 2 | DA | B.1 | ⬜ |
| SingleArtistTracks.tsx | 1 | DA | A.5 | ⬜ |
| SearchBar.tsx | 0 | DA | A.7 | ✅ Мёртвые импорты |
| ResultCard.tsx | 3 | Нет | — | ✅ Динамические |
| LibraryTree.tsx | 2 | Нет | — | ✅ Динамические |
| ProgressOverlay.tsx | 1 | Нет | — | ✅ Динамические |
| LibraryView.tsx | 1 | Нет | — | ✅ Динамические |
| GenreCloud.tsx | 1 | Нет | — | ✅ Динамические |

**Итого: ~229 inline styles осталось в 15 файлах.**
