# TODO: Unification of styles (стилизация)

## Full Audit (20.06.2026)

---

### 1. Типографика — размазана по трём системам

#### 1a. TS-константы (client/src/components/styles.ts)

| Константа | Значение | Используется в |
|-----------|----------|----------------|
| `FS` | `'14px'` | TagComparison, SettingsModal, LibraryTree, inline styles |
| `FS_L` | `'16px'` | TagComparison (уже добавлен) |
| `FS_S` | `'12px'` | TagComparison |
| `FS_SM` | `'11px'` | TagComparison |
| `FS_XS` | `'10px'` | нигде не используется |

#### 1b. CSS-переменные (client/src/index.css :root)

| Переменная | Значение | Комментарий |
|------------|----------|-------------|
| `--fs-l` | `16px` | совпадает с `FS_L` |
| `--fs-s` | `13px` | НЕ СОВПАДАЕТ с `FS_S` (12px) |

#### 1c. Хардкод fontSize в JSX (не через константы)

| Файл | Строка | Значение | Должно быть |
|------|--------|----------|-------------|
| App.tsx:175 | `<h2 style={{ fontSize: '14px' }}>` | `'14px'` | `FS` |
| App.tsx:180 | `<button style={{ fontSize: '14px' }}>` | `'14px'` | `FS` |
| ResultCard.tsx:74 | `fontSize: '14px'` | `'14px'` | `FS` |
| ResultCard.tsx:98 | `fontSize: '14px'` | `'14px'` | `FS` |
| ProgressOverlay.tsx:29 | `fontSize: '14px'` | `'14px'` | `FS` |
| ProgressOverlay.tsx:33 | `fontSize: '14px'` | `'14px'` | `FS` |
| ProgressOverlay.tsx:41 | `fontSize: '12px'` | `'12px'` | `FS_S` |
| ProgressOverlay.tsx:53 | `fontSize: '12px'` | `'12px'` | `FS_S` |
| ProgressOverlay.tsx:56 | `fontSize: '12px'` | `'12px'` | `FS_S` |
| ProgressOverlay.tsx:65 | `fontSize: '12px'` | `'12px'` | `FS_S` |
| ProgressOverlay.tsx:75 | `fontSize: '14px'` | `'14px'` | `FS` |
| LibraryTree.tsx:181 | `fontSize: ARROW_W + 'px'` | динамика | ОК |
| LibraryView.tsx:203 | `fontSize: `${size}px`` | динамика | ОК |

#### 1d. Хардкод fontSize в CSS

| Файл:строка | Селектор | Значение |
|-------------|----------|----------|
| index.css:207 | `.empty-state-hint` | `font-size: 11px !important` |
| index.css:210 | `.empty-state-hint` | `margin-top: 4px !important` |
| index.css:1360 | `.library-empty-hint` | `font-size: 11px !important` |
| index.css:1363 | `.library-empty-hint` | `margin-top: 4px !important` |

---

### 2. Цвета — продублированы, есть хардкод

#### 2a. COLORS объект (styles.ts) ссылается на CSS-переменные — ОК

Все 24 ключа в COLORS используют `'var(--...)'`. Это правильно, дублирования нет.

#### 2b. Хардкод hex-цветов в CSS

| Строка | Правило | Цвета |
|--------|---------|-------|
| index.css:6-31 | `:root` | 30 переменных — базовые цвета, ок |
| index.css:115 | `.btn-primary:hover` | `#dc2626` (должно быть через `var(--red)` с фильтром) |
| index.css:1063-1089 | `.btn-move`, `.btn-rename`, `.btn-write` | 12 хардкодных цветов |

#### 2c. Хардкод hex-цветов в TS

| Файл:строка | hex | Примечание |
|-------------|-----|------------|
| sourceConfigs.ts:2-5 | `#ef4444`, `#4ade80`, `#f97316`, `#629aa9` | дублируют CSS-переменные `--red`, `--green`, `--mbrainz`, `--bandcamp` |

---

### 3. index.css — 1975 строк, много дублирования

#### 3a. Классы, которые дублируют друг друга

| Селектор | Дублирует |
|----------|-----------|
| `.empty-state p` (lines 201-206) | почти то же, что `.modal-header-title` |
| `.folder-tree-node` (lines 371-380) | почти то же, что `.tree-item` + инлайн в LibraryTree |
| `.tag-row` (lines 1491-1498) | `.track-row` (lines 1776-1783) — разные grid |

#### 3b. !important — 4 штуки

Все в `.empty-state-hint` и `.library-empty-hint`. Должны быть заменены на нормальную специфичность.

#### 3c. Повторяющиеся паттерны

- `font-family: var(--font)` — повторён в ~30 селекторах
- `border: 1px solid var(--border)` — повторён в ~15 селекторах
- `padding: 8px 10px; border-radius: 6px; background: var(--bg); border: 1px solid var(--text-invisible)` — паттерн инпута скопирован 5+ раз

---

### 4. Шрифт Inter нигде не подключен

`index.html` (client/index.html) — нет `<link>` на Google Fonts.
А везде стоит `font-family: 'Inter', system-ui, ...`.

---

### 5. Неиспользуемые/мёртвые константы

| Константа | Где | Статус |
|-----------|-----|--------|
| `FS_XS` | styles.ts:6 | Нигде не используется |
| `simColor` | styles.ts:51 | Нигде не используется |
| `.result-card-meta` | index.css:604-609 | Нигде не используется |

---

### 6. Расхождение сеток

| Компонент | grid-template-columns | Примечание |
|-----------|----------------------|------------|
| `.tag-row` | `24px 1fr 44px 1fr` | tag comparison |
| `.track-row` | `24px 28px 1fr 44px 44px 44px 28px 1fr` | track matcher |
| `.track-artist-row` | `24px 28px 1fr 44px 44px 44px 28px 1fr` | track artists |

Возможно, норм — разные компоненты. Но стоит проверить визуальную консистентность.

---

## План унификации

### Шаг 1: Согласовать шкалу размеров

Выбрать единую шкалу. Предлагаю:

```
base  = 14px  (FS)
+2    = 16px  (FS_L)
-1    = 13px  (--fs-s в CSS — сохранить)
-2    = 12px  (FS_S)
-3    = 11px  (FS_SM)
-4    = 10px  (FS_XS)
```

**Действия:**
- [ ] Удалить `--fs-s: 13px` из CSS, если не нужен отдельно (или переименовать чтобы не путать)
- [ ] Сделать `styles.ts` константы ссылающимися на CSS-переменные:
  ```ts
  export const FS = 'var(--fs)';
  export const FS_L = 'var(--fs-l)';
  export const FS_S = 'var(--fs-s)';
  export const FS_SM = 'var(--fs-sm)';
  export const FS_XS = 'var(--fs-xs)';
  ```
- [ ] Добавить недостающие переменные в `:root`:
  ```css
  --fs-sm: 11px;
  --fs-xs: 10px;
  ```

### Шаг 2: Убрать хардкод fontSize из JSX

- [ ] ProgressOverlay.tsx — заменить все `'14px'` на `FS`, `'12px'` на `FS_S`
- [ ] ResultCard.tsx — заменить `fontSize: '14px'` на `FS`
- [ ] App.tsx — заменить `fontSize: '14px'` на `FS`

### Шаг 3: Убрать !important из CSS

- [ ] `.empty-state-hint` — переписать через нормальную специфичность (или использовать класс)
- [ ] `.library-empty-hint` — то же

### Шаг 4: Убрать хардкод hex-цветов

- [ ] `sourceConfigs.ts` — заменить hex на ссылки через `COLORS`
- [ ] `.btn-move` / `.btn-rename` / `.btn-write` — либо вынести в переменные, либо унифицировать с остальными кнопками
- [ ] `.btn-primary:hover` — заменить `#dc2626` на `var(--red)` с opacity-фильтром

### Шаг 5: Подключить Inter в index.html

- [ ] Добавить `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">` в `<head>`

### Шаг 6: Удалить мёртвый код

- [ ] `FS_XS` — если не используется нигде, удалить
- [ ] `simColor` — удалить из styles.ts
- [ ] `.result-card-meta` — удалить из index.css

### Шаг 7: Убрать дубликаты из CSS

- [ ] Инпуты: создать единый класс `.input-base` и использовать везде вместо копипасты
- [ ] `font-family: var(--font)` — вынести в :root и наследовать через `body`

### Шаг 8 (будущее): Ползунок масштаба

После того как всё ссылается на CSS-переменные `--fs`, `--fs-l`, `--fs-s`, `--fs-sm`, `--fs-xs`:
- [ ] Добавить range input в SettingsModal
- [ ] Менять `document.documentElement.style.setProperty('--fs', value + 'px')`
- [ ] Производные (`--fs-l`, `--fs-s`...) пересчитывать динамически
