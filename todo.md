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
- [ ] **4.1** — index.css: утилиты (`.row`, `.col`, `.gap-*`, `.p-*`, `.mb-*`, `.flex-1`, `.shrink-0`)
- [ ] **4.2** — index.css: панели (`.panel`, `.cell`, `.percent`, `.label-uppercase`, `.hint`, `.cb`)
- [ ] **4.3** — SearchResults.tsx (15 inline)
- [ ] **4.4** — SearchBar.tsx (10 inline)
- [ ] **4.5** — Footer.tsx (15 inline)
- [ ] **4.6** — FolderPicker.tsx (18 inline)
- [ ] **4.7** — SingleArtistTracks.tsx (включая simColor → CSS)
- [ ] **4.8** — TrackArtistField.tsx (3 inline)
- [ ] **4.9** — ApplyPanel.tsx (5 inline)
- [ ] **4.10** — ErrorBoundary.tsx (5 inline)
- [ ] **4.11** — ContextMenu.tsx (2 inline)
- [ ] **4.12** — WebfetchOverlay.tsx (11 inline)

### Группа 5: simColor → CSS-классы
- [ ] **5.1** — index.css: `.sim-high`, `.sim-mid`, `.sim-low`
- [ ] **5.2** — MatchRow.tsx: `simColor` → классы
- [ ] **5.3** — SingleArtistTracks.tsx: `simColor` → классы
- [ ] **5.4** — MultiArtistTracks.tsx: `simColor` → классы

### Группа 6: TagComparison.tsx (data-атрибуты) — 59 inline
> ⚠️ Это таблица с полями ввода. Сначала нужен прототип таблицы (см. "Таблица: единый стиль" выше). Не трогать value/onChange/onKeyDown.

- [ ] **6.0** — Прототип таблицы: HTML-файл со всеми вариациями полей, отработать визуал
- [ ] **6.1** — index.css: `.table-row`, `.table-cell`, `.table-label`, `.table-input`, `.table-section-header`, data-атрибуты
- [ ] **6.2** — TagComparison.tsx: замена 59 inline, сверяя с прототипом

### Группа 7: MatchRow.tsx (data-атрибуты) — 16 inline
> ⚠️ Это строка таблицы с полем ввода названия трека. Тот же стиль что Group 6.

- [ ] **7.1** — index.css: `.track-name-input[data-unmatched]`, `[data-edited]`
- [ ] **7.2** — MatchRow.tsx: замена 16 inline

### Группа 8: MultiArtistTracks.tsx — 12 inline
- [ ] **8.1** — MultiArtistTracks.tsx: замена 12 inline

### Группа 9: SettingsModal.tsx — 30 inline
- [ ] **9.1** — SettingsModal.tsx: замена 30 inline

### Группа 10: App.tsx (остатки)
- [ ] **10.1** — App.tsx: замена оставшихся inline

### Группа 11: TrackMatcher.tsx — 30 inline
> ⚠️ Это таблица треков с полями ввода. Тот же стиль что Group 6. Сначала прототип.

- [ ] **11.0** — Убедиться что прототип таблицы (6.0) покрывает все состояния TrackMatcher
- [ ] **11.1** — TrackMatcher.tsx: замена 30 inline, сверяя с прототипом

### Финально
- [ ] **12.0** — Удалить `client/src/components/styles.ts`
- [ ] **12.1** — Убрать `import { ... } from './styles'` из всех файлов
- [ ] **🔴 Регрессия**: полный проход по всем функциям

---

## Аудит: оставшиеся inline styles (по файлам)

| Файл | Inline | Импорт styles | Статус |
|------|--------|---------------|--------|
| TagComparison.tsx | 59 | DA | ⬜ Группа 6 |
| TrackMatcher.tsx | 30 | DA | ⬜ Группа 11 |
| SettingsModal.tsx | 30 | DA | ⬜ Группа 9 |
| FolderPicker.tsx | 18 | DA | ⬜ Группа 4 |
| MatchRow.tsx | 16 | DA | ⬜ Группа 7 |
| Footer.tsx | 15 | DA | ⬜ Группа 4 |
| SearchResults.tsx | 15 | DA | ⬜ Группа 4 |
| MultiArtistTracks.tsx | 12 | DA | ⬜ Группа 8 |
| WebfetchOverlay.tsx | 11 | DA | ⬜ Группа 4 |
| SearchBar.tsx | 10 | DA | ⬜ Группа 4 |
| ApplyPanel.tsx | 5 | DA | ⬜ Группа 4 |
| ErrorBoundary.tsx | 5 | DA | ⬜ Группа 4 |
| ResultModal.tsx | 5 | Нет | ⬜ Группа 4 |
| TrackArtistField.tsx | 3 | DA | ⬜ Группа 4 |
| ContextMenu.tsx | 2 | DA | ⬜ Группа 4 |
| ResultCard.tsx | 3 | Нет | ✅ Динамические |
| LibraryTree.tsx | 2 | Нет | ✅ Динамические |
| ProgressOverlay.tsx | 1 | Нет | ✅ Динамические |
| LibraryView.tsx | 1 | Нет | ✅ Динамические |
| GenreCloud.tsx | 1 | Нет | ✅ Динамические |

**Итого: ~243 inline styles осталось в 15 файлах.**
