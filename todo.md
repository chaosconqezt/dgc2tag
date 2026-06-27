# dgc2tag — План исправлений

## 🔴 Критические (делать в первую очередь)

### 1. Относительные пути `./user_data` → абсолютные
**Файлы:** `server/src/scraper.ts:15-16, 216`
**Что:** `userDataDir: './user_data'` и `path.join('./user_data', ...)` зависят от CWD.
**Как чинить:** 
- Заменить `'./user_data'` на `path.join(__dirname, '../../user_data')` в `launchBrowser()`
- Заменить `path.join('./user_data', 'DevToolsActivePort')` на путь от `__dirname` в `findRunningBrowserWs()`
- Проверка: `findRunningBrowserWs` должен находить порт при запуске из любой директории
- Тест: `cd server && tsx src/index.ts` и `cd .. && tsx server/src/index.ts`

### 2. Спред `currentTags` тащит `_buffer` и служебные поля
**Файл:** `server/src/tagWriter.ts:115-124`
**Что:** `{ ...currentTags }` копирует `_buffer` и др. внутренние поля в `updatedTags`, что ломает `NodeID3.write()`.
**Как чинить:**
- Вместо `{ ...currentTags }` собрать `updatedTags` вручную из известных полей
- Список безопасных полей: `artist`, `performerInfo`, `album`, `year`, `genre`, `publisher`, `title`, `userDefinedText`
- Игнорировать `_buffer`, `TLEN`, `recordingTime`, `notes`, `bitrate`, `audioFormat` и т.д.
- **Никогда не передавать `_buffer` из read обратно в write**

### 3. Небезопасное `Buffer.from(_buffer as unknown as ArrayBuffer)`
**Файл:** `server/src/tagWriter.ts:156-161`
**Что:** Приведение типа ломает при отсутствии/невалидности `_buffer`. Файл читается с диска, но без учёта изменений `userDefinedText`.
**Как чинить:**
- Убрать блок с `_buffer` целиком
- Всегда читать файл с диска: `const fileBuffer = await fs.readFile(filePath);`
- `NodeID3.write()` сам наложит изменения из `updatedTags` на сырой буфер
- Тест: запись тегов в файл, где NodeID3 возвращает `_buffer`

### 4. `page.goto()` блокирует запуск сервера на 60s
**Файл:** `server/src/scraper.ts:229`
**Что:** `launchBrowser()` вызывает `page.goto(...)` с таймаутом 60s перед тем, как сервер начнёт слушать порт.
**Как чинить:**
- Уменьшить таймаут до 15-20s
- Запускать `ensureTaxonomy()` и инициализацию браузера в фоне (без `await`), не блокируя `app.listen()`
- В `index.ts` убрать `await ensureTaxonomy()` из стартового блока, запустить fire-and-forget
- Добавить повторную попытку при ошибке загрузки страницы

### 5. `getAllLibraryAlbums()` — последовательное чтение
**Файл:** `server/src/library.ts:192-221`
**Что:** Для каждой группы читаются альбомы по одному — медленно при сотнях групп.
**Как чинить:**
- Заменить последовательный обход на параллельное чтение с `Promise.all()`
- Читать альбомы каждой группы параллельно
- Ограничить concurrency до ~10 групп одновременно (чтобы не убить диск)

## 🟡 Высокий приоритет

### 6. Несоответствие `SERVER_PORT` vs `PORT`
**Файл:** `server/src/config.ts:60-70`
**Что:** `.env.example` определяет `SERVER_PORT`, а код читает `process.env.PORT`.
**Как чинить:**
- В `DEFAULTS` читать `process.env.SERVER_PORT ?? process.env.PORT ?? '3000'`
- Обновить `config.default.json` и `.env.example` для единообразия

### 7. Жёстко заданные диски C:-J: для Windows
**Файл:** `server/src/index.ts:441`
**Что:** Обход только дисков C:-J:. Диски A:-B: и K:+ недоступны.
**Как чинить:**
- Использовать `fs.readdir('/')` на Windows или `DriveType === 3` (fixed/removable)
- Или захардкодить `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')` + проверка `fs.access()`

### 8. Запросы к источникам не отменяются при новом поиске
**Файл:** `client/src/hooks/useSearch.ts:82-109`
**Что:** Старые поисковые запросы продолжают выполняться. Для Deezer с rate limiting может быть блокировка.
**Как чинить:**
- Сохранять `AbortController` для каждого источника при начале поиска
- При новом поиске отменять старые контроллеры
- Передавать `signal` в API-функции (они принимают `AbortSignal` через axios interceptor или параметр)

### 9. Симлинки игнорируются сканером
**Файл:** `server/src/scanner.ts:77`
**Что:** `if (entry.isSymbolicLink()) continue;` — симлинки не видны.
**Как чинить:**
- Разрешить симлинки, но добавить защиту от циклов (уже есть через `visited` + `realpath`)
- Опция: добавить флаг `followSymlinks` в конфиг

### 10. `alert()` вместо ResultModal
**Файл:** `client/src/hooks/useConfig.ts:61,71,73`
**Что:** Ошибки сохраняются и очистка кеша используют нативный `alert()`.
**Как чинить:**
- Заменить `alert()` на диспатч `SET_RESULT_MODAL` с соответствующим сообщением
- Импортировать `dispatch` в функции (уже доступен)

## 🔵 Средний приоритет

### 11. Deezer search — нет try-catch на первый запрос
**Файл:** `server/src/deezer.ts:60-62`
**Как чинить:** Обернуть `axios.get(...)` в try-catch, при ошибке → `return []`

### 12. Извлечение года — первое `\d{4}` ненадёжно
**Файл:** `server/src/tagger.ts:132-142`
**Как чинить:** Уже относительно надёжно (поле year обычно содержит только год/дату). Добавить проверку, что год в разумном диапазоне (1900-2099).

### 13. `cancelActiveRequests` не отменяет запросы с внешним signal
**Файл:** `client/src/api.ts:19`
**Как чинить:** В `createRequestId` и interceptor уже есть корректная обработка. Проблема только в `webfetchPage`, где signal передаётся отдельно. Ничего не менять — это intentional API.

### 14. Нет `getDetails` для Deezer, но в api.ts есть функция
**Файл:** `client/src/api.ts`
**Как чинить:** Удалить неиспользуемую функцию `searchAlbumsDeezer` и `fetchDeezerAlbum` (или добавить соответствующий source handler на сервере).

### 15. `parseGenresFromPage` — сырой regex
**Файл:** `server/src/scraper.ts:492-526`
**Как чинить:** Заменить на более точный парсинг, но низкий приоритет — функция не критична.

### 16. Path traversal в `/api/cover/:bandId/:postId`
**Файл:** `server/src/index.ts:311`
**Что:** `bandId` и `postId` не валидируются на path traversal (`../../etc`), хотя они приводятся к числу — защищены через `parseInt()`.

### 17. `getBandDiscography` не сохраняет offset при ошибке
**Файл:** `server/src/scraper.ts:583-603`
**Как чинить:** Если fetch упал, offset не меняется, запрос повторяется с тем же offset — вечный цикл. Добавить retry с экспоненциальной задержкой.

## 🟢 Низкий приоритет / рефакторинг

### 18. `as any` для puppeteer
**Файл:** `server/src/scraper.ts`
**Как чинить:** Добавить declare module для puppeteer-extra или использовать типы из `@types/puppeteer`

### 19. Неизвестные action тихо игнорируются в production
**Файл:** `client/src/hooks/appReducer.ts:255`
**Как чинить:** Убрать guard `import.meta.env.DEV` или добавить в production логгер

### 20. `sanitize()` — коллизия имён
**Файл:** `server/src/tagWriter.ts:340-341`
**Как чинить:** Добавить постфиксные дублирующие суффиксы (как уже сделано для `moveProcessedFiles` через `(counter)`)

### 21. Жёстко заданная локаль `'ru'`
**Файл:** `client/src/components/LibraryView.tsx:17`
**Как чинить:** Вынести в конфиг или определять из `navigator.language`

### 22. `extractTrackNumber` не обрабатывает multi-disc
**Файл:** `server/src/trackUtils.ts`
**Как чинить:** Добавить поддержку паттернов `2-01`, `1/12`, `CD1-01` — извлекать последнюю часть как номер трека

### 23. `SearchSource` неединообразные параметры
**Файл:** `server/src/sources/types.ts`
**Как чинить:** Унифицировать сигнатуру: `search(artist?: string, album?: string, query?: string)` — уже так и есть, но dgc использует только query, остальные — artist/album. Добавить JSDoc.

## Структура для новой сессии

```
session-1/     # 🔴 Пп. 1-5 (критические)
  - scraper.ts paths fix
  - tagWriter.ts safe fields
  - tagWriter.ts buffer fix
  - scraper.ts async init + server startup
  - library.ts parallel read

session-2/     # 🟡 Пп. 6-10 (высокие)
  - config.ts env fix
  - index.ts drive letters
  - useSearch.ts AbortController
  - scanner.ts symlinks
  - useConfig.ts ResultModal

session-3/     # 🔵 Пп. 11-17 (средние)
  - deezer.ts try-catch
  - api.ts cleanup
  - scraper.ts pagination fix
  - остальные средние

session-4/     # 🟢 Пп. 18-23 (улучшения)
  - все низкоприоритетные
```
