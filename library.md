# Library — Концепция

## Суть
Трекинг альбомов с DGC. После тегирования альбом автоматически попадает в библиотеку. Библиотека = локальная папка `library/` с метаданными. Дискография берётся автоматически с DGC через Puppeteer.

## DGC API для дискографии (ИССЛЕДОВАНО)

### Эндпоинт: GET /api/bands/:bandId

Возвращает полную информацию о банде + дискографию.

Пример: `https://deathgrind.club/api/bands/42`

```json
{
  "band": {
    "bandId": 42,
    "name": "Blood Red Throne",
    "genre": "Death Metal",
    "country": ["NO"],
    "albumCount": 15,
    "discography": {
      "posts": [
        {
          "postId": 90679,
          "bands": [{"name": "Blood Red Throne", "bandId": 42}],
          "album": "Siltskin",
          "country": ["NO"],
          "genre": [19],
          "type": [1],
          "label": [{"name": "Soulseller Records", "labelId": 413}],
          "releaseDate": [2025, 12, 5],
          "attachments": [{"file": "...", "thumb": "..."}],
          "videoIds": ["..."],
          "reactions": [{"reaction": "👍", "count": 177}]
        }
      ],
      "hasMore": true,
      "offset": 1
    }
  }
}
```

### Пагинация
- Первый запрос: `GET /api/bands/:bandId` (offset по умолчанию 0)
- Следующие: `GET /api/bands/:bandId?offset=N` пока `hasMore: true`
- Каждый ответ содержит ~12 постов

### Реализация в scraper.ts
Паттерн `apiFetch()` уже делает `page.evaluate(fetch(...))` — можно использовать напрямую:

```ts
export async function getBandDiscography(bandId: number): Promise<DiscographyResult> {
  const allPosts: DgcPost[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await apiFetch<{ band: { discography: { posts: DgcPost[]; hasMore: boolean; offset: number } } }>(
      `/api/bands/${bandId}?offset=${offset}`
    );
    allPosts.push(...(data.band?.discography?.posts || []));
    hasMore = data.band?.discography?.hasMore ?? false;
    offset = data.band?.discography?.offset ?? offset + 1;
  }

  return { bandId, posts: allPosts.map(p => mapPost(p, p.genre, p.type)) };
}
```

## Структура папки library/

```
library/
  {bandId}/
    {postId}/
      album.json    — метаданные альбома
      cover.jpg     — обложка
```

- bandId — ID банды с DGC (из DgcPost.bands[].bandId)
- postId — ID поста/альбома с DGC
- Если у банды нет bandId — она не трекается

## album.json

```json
{
  "postId": 12345,
  "bandId": 42,
  "artist": "Carcass",
  "album": "Heartwork",
  "year": "1993",
  "genre": "Death Metal",
  "label": "Earache",
  "releaseType": "Album",
  "trackCount": 10,
  "coverUrl": "https://cdn.deathgrind.club/s/...",
  "dateAdded": "2026-06-26T22:00:00Z"
}
```

## Автоматическое добавление

Альбом попадает в library/ при:
- WRITE — запись тегов (если selectedResult из DGC)
- WRITE & RENAME — запись + переименование
- WRITE & MOVE — запись + перемещение

Логика: если selectedResult.source === dgc и есть bandId — создаём library/{bandId}/{postId}/.

## Ключевой API DGC (из scraper.ts)

```
GET /api/posts/search?q=...     — поиск альбомов
GET /api/posts/:postId          — детали поста
GET /api/bands/:bandId          — инфо о банде + дискография (ПОДТВЕРЖДЕНО)
```

DgcPost содержит bands: { name: string; bandId: number }[] — bandId уже есть в результатах поиска.

## Файлы для реализации

| Файл | Что делать |
|---|---|
| server/src/scraper.ts | Добавить getBandDiscography(bandId) — apiFetch /api/bands/:bandId с пагинацией |
| server/src/library.ts (новый) | CRUD: saveAlbumMeta, loadAlbumMeta, getBandLibrary |
| server/src/index.ts | Эндпоинты: GET/POST/DELETE /api/library/* |
| client/src/api.ts | Функции клиента |
| client/src/hooks/appReducer.ts | State: libraryEntries, viewMode |
| client/src/components/DiscographyView.tsx (новый) | Режим сравнения дискографии |
| client/src/App.tsx | Кнопки, view mode, интеграция |
