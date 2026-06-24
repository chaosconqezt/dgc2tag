# DGC Tagger — Сетевое тестирование

## Тестовая конфигурация

```
Сервер: Windows 10/11, Node.js 20+
Сеть: Samba (SMB 2.0+) или Windows share
Путь: \\SERVER\MUSIC\ или Z:\ (mounted)
musicRoot в config.json: "\\SERVER\MUSIC\" или "Z:\"
```

---

## Тест 1: Запуск сервера с сетевым путём

### Ожидаемое поведение
- Сервер стартует без ошибок
- `config.json` загружается корректно
- `musicRoot` распознаётся как UNC путь

### Что проверить
```bash
# 1. Запустить сервер
npm run dev

# 2. Проверить логи — должен показать musicRoot
# Ожидание: [INFO] Server running at http://localhost:3000
# Ожидание: [INFO] Music root: \\SERVER\MUSIC\

# 3. Проверить config
curl http://localhost:3000/api/config
# Ожидание: {"musicRoot":"\\\\SERVER\\MUSIC\\",...}
```

### Возможные ошибки
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `ENOENT` на config.json | Путь к папке сервера неверный | Проверить `__dirname` в config.ts |
| `EACCES` | Нет прав на сетевую папку | Проверить права Samba share |
| UNC путь не распознаётся | Node.js не видит share | Монтировать как диск (Z:) |

---

## Тест 2: Просмотр дерева библиотеки

### Ожидаемое поведение
- Библиотека загружается, дерево отображается
- Аудиофайлы (.mp3, .flac, .m4a) отмечаются как `hasAudioFiles: true`

### Что проверить
```bash
# 1. Запрос дерева
curl http://localhost:3000/api/library
# Ожидание: JSON массив FileNode[]

# 2. Lazy load детей
curl "http://localhost:3000/api/library/children?dirPath=\\SERVER\MUSIC\Artist"
# Ожидание: массив файлов и папок

# 3. В UI — открыть папку в sidebar
# Ожидание: дерево загружается, стрелки работают
```

### Возможные ошибки
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `ENOTDIR` | Путь не является директорией | Проверить формат UNC |
| Пустое дерево | `readdirSync` не видит файлы | Проверить права доступа |
| Долгая загрузка | Сеть медленная | Увеличить timeout |
| `EMFILE` | Слишком много файлов | Ограничить глубину |

---

## Тест 3: Чтение тегов

### Ожидаемое поведение
- Теги читаются из MP3 файлов на сетевом диске
- `AlbumTags` возвращается корректно

### Что проверить
```bash
# 1. Чтение тегов из папки
curl "http://localhost:3000/api/tags?folderPath=\\SERVER\MUSIC\Artist\Album"
# Ожидание: AlbumTags с artist, album, year, files[], trackTitles, etc.

# 2. В UI — выбрать папку с MP3
# Ожидание: TAG COMPARISON и TRACKS панели отображаются
```

### Возможные ошибки
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `ENOENT` | Файл не найден (путь) | Проверить экранирование `\` |
| `EACCES` | Нет прав на чтение | Проверить права Samba |
| Пустые теги | NodeID3 не читает по сети | Проверить буферизацию |
| `ERR_FS_FILE_TOO_LARGE` | Файл повреждён | Добавить try/catch |

---

## Тест 4: Запись тегов

### Ожидаемое поведение
- Теги записываются в MP3 файлы на сетевом диске
- Файлы переименовываются

### Что проверить
```bash
# 1. Запись тегов (WRITE mode)
curl -X POST http://localhost:3000/api/tags/update \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"\\\\SERVER\\MUSIC\\Artist\\Album","tags":{"artist":"Test"},"moveFiles":false,"renameFiles":false}'
# Ожидание: {"success":true}

# 2. Переименование (WRITE & RENAME)
curl -X POST http://localhost:3000/api/tags/update \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"\\\\SERVER\\MUSIC\\Artist\\Album","tags":{"artist":"Test","album":"Test Album"},"moveFiles":false,"renameFiles":true}'
# Ожидание: {"success":true,"renamed":["01. Test - Track.mp3",...]}

# 3. Проверить файлы на диске
ls "\\SERVER\MUSIC\Artist\Album\"
# Ожидание: файлы переименованы
```

### Возможные ошибки
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `EBUSY` | Файл заблокирован | Закрыть плеер/редактор |
| `EPERM` | Нет прав на запись | Проверить права Samba (read/write) |
| `EXDEV` | Cross-device rename | Использовать copy+delete fallback |
| `ENOSPC` | Мало места | Проверить дисковое пространство |

---

## Тест 5: Перемещение файлов (MOVE mode)

### Ожидаемое поведение
- Файлы перемещаются в outputFolder
- Папка назначения создаётся
- Пустые папки удаляются

### Что проверить
```bash
# 1. Настроить outputFolder в config
# outputFolder: "\\SERVER\MUSIC_PROCESSED\"

# 2. Переместить
curl -X POST http://localhost:3000/api/tags/update \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"\\\\SERVER\\MUSIC\\Artist\\Album","tags":{"artist":"Test","album":"Test Album","year":"2024"},"moveFiles":true,"renameFiles":true}'
# Ожидание: {"success":true,"moved":["file_1","file_2",...]}

# 3. Проверить назначение
ls "\\SERVER\MUSIC_PROCESSED\Test\2024 - Test Album\"
# Ожидание: файлы на месте
```

### Возможные ошибки
| Ошибка | Причина | Решение |
|--------|---------|---------|
| `EPERM` | Нет прав на создание папки | Проверить права |
| `EACCES` | Нет прав на удаление | Проверить права |
| `ERR_FS_DIR_NOT_EMPTY` | Папка не пуста | Проверить `cleanEmptyFolders` |
| Файлы на разных shares | `fs.rename` не работает跨share | copy+delete fallback |

---

## Тест 6: Path traversal protection

### Ожидаемое поведение
- Попытка выйти за пределы musicRoot блокируется (403)

### Что проверить
```bash
# 1. Попытка чтения тегов за пределами musicRoot
curl "http://localhost:3000/api/tags?folderPath=\\SERVER\OTHER_FOLDER"
# Ожидание: 403 Access denied

# 2. Попытка записи за пределами
curl -X POST http://localhost:3000/api/tags/update \
  -H "Content-Type: application/json" \
  -d '{"folderPath":"\\\\SERVER\\OTHER\\folder","tags":{}}'
# Ожидание: 403 Access denied

# 3. Попытка обхода через .. 
curl "http://localhost:3000/api/tags?folderPath=\\SERVER\MUSIC\..\..\SECRET"
# Ожидание: 403 Access denied (path.resolve нормализует)
```

---

## Тест 7: Производительность

### Метрики для измерения
| Операция | Локально | По сети (Samba) | Допустимо |
|----------|----------|-----------------|-----------|
| Загрузка дерева (100 папок) | ~200ms | ~2-5s | <10s |
| Чтение тегов (10 треков) | ~50ms | ~500ms-2s | <5s |
| Запись тегов (10 треков) | ~100ms | ~1-3s | <10s |
| Переименование (10 файлов) | ~50ms | ~500ms-2s | <5s |
| Поиск DGC | ~1-2s | ~1-2s | <5s |

### Что проверить
- Открыть папку с 50+ альбомами — дерево загружается?
- Выбрать альбом с 20 треками — теги читаются?
- Записать теги — не зависает?
- Проверить console на ошибки timeout

---

## Тест 8: UNC特殊ые случаи

### Кейсы
```
\\server\share\folder          — стандартный UNC
\\192.168.1.100\share\folder   — UNC по IP
Z:\folder                      — mounted drive
\\server\share with spaces\    — пробелы в пути
\\server\share\кириллица\      — кириллица в пути
\\server\share\folder (1)\     — скобки в имени
```

### Что проверить
1. Каждый формат пути — дерево загружается?
2. Кириллица — файлы отображаются корректно?
3. Пробелы — теги записываются?
4. Скобки — rename работает?

---

## Автоматический тест скрипт

```bash
#!/bin/bash
# save as test-network.sh

SERVER="localhost:3000"
MUSIC_ROOT="\\\\SERVER\\MUSIC"

echo "=== Test 1: Config ==="
curl -s http://$SERVER/api/config | head -c 200
echo

echo "=== Test 2: Library ==="
curl -s http://$SERVER/api/library | head -c 200
echo

echo "=== Test 3: Tags ==="
curl -s "http://$SERVER/api/tags?folderPath=$MUSIC_ROOT/TestAlbum" | head -c 200
echo

echo "=== Test 4: Path traversal ==="
curl -s -o /dev/null -w "%{http_code}" "http://$SERVER/api/tags?folderPath=$MUSIC_ROOT/../../../secret"
echo " (expect 403)"

echo "=== All tests done ==="
```

---

## Известные ограничения

1. **Puppeteer** — браузер запускается локально, не по сети
2. **Cache** — файловый кеш хранится локально (`cache/`, `taxonomy-cache.json`)
3. **User data** — Puppeteer cookies в `user_data/` (локально)
4. **config.json** — хранится рядом с сервером, не на сетевом диске
5. **Логи** — пишутся в stdout, не в файл (нет ротации)

---

## Чек-лист перед запуском

- [ ] Samba share доступен с машины с сервером
- [ ] Права на чтение/запись на share
- [ ] `musicRoot` в config.json указывает на UNC путь
- [ ] Папка `user_data/` существует (для Puppeteer)
- [ ] Папка `cache/` существует
- [ ] Порт 3000 свободен
- [ ] Node.js 20+ установлен
- [ ] `npm install` выполнен
