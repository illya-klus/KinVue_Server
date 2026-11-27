# Медіа Sprint 5

Джерело: стан репозиторію, 2026-11-22. Вимоги — рішення 0026.

## Запуск і межі

Movie використовує власну `kinvue_movie` та наявний Prisma Next graph. Нової міграції немає: `movie_uploads` і `movie_outbox_events` створені Sprint 3. Перед запуском — `pnpm --filter @kinvue/movie migrate:deploy`. Локальна інфраструктура лишається в кореневому Compose.

`S3_ENDPOINT` — адреса API для сервера; необов'язковий `S3_PUBLIC_ENDPOINT` — адреса того самого сховища, досяжна браузеру. Вона використовується під час підпису, а не заміною hostname після підпису. Bucket/credentials — `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`. Локальний bucket `kinvue-media` приватний. MinIO CORS дозволяє `WEB_ORIGIN` (типово `http://localhost:3000`) і відкриває ETag; інше S3-сховище потребує еквівалентної CORS-політики для GET/HEAD/PUT і ETag.

Це S3-адаптер локальної доставки, не вибір хмарного CDN. URL підписуються AWS SigV4. Gateway і Movie не передають відеобайти; браузер звертається до сховища напряму. FFmpeg на хості не запускається; транскодування належить окремому worker-контейнеру.

## Multipart

- Admin через Gateway викликає `POST /api/admin/movies/:id/upload/init` з fileName/contentType/fileSizeBytes/partCount. Допустимі MP4/QuickTime/Matroska; `1_000_000 < size <= 25_000_000_000`. Клієнт використовує частини по 8 MiB. S3 вимагає щонайменше 5 MiB для всіх частин, крім останньої.
- Лише NONE/UPLOAD_FAILED/ABANDONED можуть стати UPLOADING. PostgreSQL transaction/advisory lock на movie серіалізує init/complete/cleanup на всіх Movie instances. URL повертаються після збереження рядка й коміту. Невдалий init перериває створений multipart; старі orphan multipart прибирає maintenance.
- PUT частин іде за підписаними URL, чинними 1 годину. Реальний ETag обов'язковий; вигаданого fallback немає. Клієнт зберігає успішні частини в пам'яті поточної сторінки і повторює тільки решту, до трьох автоматичних спроб. Перезавантаження сторінки не відновлює upload.
- `POST /api/admin/movies/:id/upload/:uploadId/parts` оновлює URL тієї самої активної сесії протягом 24 годин. Успішні ETag зберігаються. Після втрати відповіді complete клієнт повторює complete без PUT готових частин.
- Complete приймає всі очікувані унікальні номери та непорожні ETag. Після S3 confirmation однією DB-транзакцією позначає COMPLETED, PROCESSING та зберігає стабільний jobId/movieId/originalKey/attempt=1 в outbox. Повторний complete ідемпотентний. Якщо процес впав між S3 complete і DB commit, повтор використовує наявний об'єкт після NoSuchUpload + HEAD.
- Maintenance кожні 30 секунд публікує outbox із RabbitMQ publisher confirm. Збій лишає PENDING. Доставка at-least-once: crash між confirm та DB commit може повторити той самий jobId; це не гарантія exactly-once.
- Незавершені сесії старше 24 годин abort → ABANDONED, молодші зберігаються. Після abort допускається новий init. Завершені оригінали автоматично не видаляються.

## HLS

`POST /api/movies/:id/media-access` потребує перевіреної Gateway автентифікації; Movie додатково вимагає trusted user context. Потрібні PUBLISHED + READY + master playlist. Чернетки й анонімні виклики відхиляються.

Movie читає тільки невеликі HLS control manifests, створює приватні session manifests у `_access/<uuid>/` та підписує всі їхні дочірні playlist/segment URI одним часом із TTL 600 секунд. Відповідь API — тільки JSON `{url, expiresAt}`. Master, вкладені playlist і сегменти віддає S3. Зовнішні URI, вихід за movie HLS prefix, цикли та надмірні графи відхиляються (до 32 playlist, 20 000 references, 2 MB на playlist). Непідписані об'єкти недоступні. Локальна lifecycle rule видаляє `_access/` через 1 день; це прибирання об'єктів, тоді як доступ припиняється вже через 600 секунд. Іншим S3 environments потрібна аналогічна lifecycle rule.

Клієнт спочатку запитує доступ, завантажує HLS зі сховища і поновлює доступ за 30 секунд до expiry. Solo зберігає позицію, room застосовує authoritative playback. Вихід знищує HLS, зупиняє video та скасовує renewal timer. Ролі та version/state_sync зі Sprint 4 зберігаються.

## Перевірки

`pnpm --filter @kinvue/movie build`, потім із services/movie: `node --test test/media.integration.test.cjs`. Тест сам створює й зупиняє власні PostgreSQL 16, MinIO і RabbitMQ; порти 55435/59000/55672 мають бути вільні. `MEDIA_TEST_MINIO_IMAGE` дозволяє задати образ. `MEDIA_BROWSER_VERIFY=1` додатково перевіряє реальні browser PUT/GET/CORS/ETag, якщо поруч встановлені KinVue_Client і Chromium; використовує порт 3009.

Client: `pnpm exec playwright test e2e/media-sprint-5.spec.ts e2e/solo-playback.spec.ts e2e/rooms-realtime.spec.ts`. Gateway regression `media-boundary.spec.ts` забороняє медіамаршрути та object-byte responses у Movie HTTP handlers.

Інтеграція використовує контрольні HLS fixtures; вона не підтверджує декодування справжнього фільму або роботу FFmpeg worker. Розгортання хмарного CDN і робота інших виконавців Sprint 5 цим звітом не закриваються.
