# Movie: каталог і watchlist (Sprint 3)

Джерело: задачі KIN-43/47/51/156/158/160/162/165/169/173/188/190/194/198/201/206 і рішення 0011, 0012, 0026.

## База даних

Node 24, pnpm 10.34.4, окрема PostgreSQL 16 `kinvue_movie`, локальний порт 5434. З кореня workspace:

```sh
pnpm install --frozen-lockfile
pnpm --filter @kinvue/movie migrate:deploy
pnpm --filter @kinvue/movie build
pnpm --filter @kinvue/movie start:prod
```

Передайте `MOVIE_DATABASE_URL` через оточення процесу. Runner і Prisma config відхиляють іншу назву БД; загальний `DATABASE_URL` не вибирає базу Movie. Команда запускає Prisma Next з каталогу Movie, застосовує тільки його граф міграцій і створює singleton `movies`. Повторний запуск не повторює вже застосовані версії. Auth міграції тут не запускаються. Перед запуском контейнера міграції виконують із повного checkout із dev dependencies; production image містить сервіс, а не Prisma CLI.

Контракт: `services/movie/src/prisma/contract.prisma`; версії: `services/movie/migrations/app`; snapshots і ref `db` включено в Git. Для нової зміни: `contract:emit`, потім `prisma migration plan --from <поточний hash> --name <назва>`, перегляд операцій та оновлення ref. App startup більше не виконує SQL DDL.

Граф починається з порожньої бази. Старі `migrations/001_*.sql`–`003_*.sql` залишені як історія попереднього прототипу і не виконуються. Базу, де вони вже створили таблиці `id/status`, цей baseline автоматично не перебудовує: не видаляйте її для запуску. Для перенесення наявних даних потрібні backup, окремий перевірений data migration і справжній автор старих фільмів (у старій схемі його немає).

Схема зберігає окремі publication/media states, metadata й UUID автора без FK до Auth. Upload records містять multipart id, object key, part count, expires/completed timestamps без байтів відео. `expires_at` поточного upload дорівнює строку дії наявних presigned parts (1 година), це не політика видалення об'єктів. Watchlist має PK `(user_id,movie_id)`. Outbox створений для майбутніх подій; publisher цього спринту ще не потрібен.

## HTTP через Gateway

Клієнт звертається до `NEXT_PUBLIC_GATEWAY_URL` (локально `http://localhost:4000`) з префіксом `/api`. Нижче шляхи приватного Movie без цього префікса. Gateway перевіряє JWT і перезаписує `x-user-id/x-user-scopes`; приватний сервіс не публікують напряму.

| Метод і шлях                         | Поведінка                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| POST /admin/movies                   | Admin; title, description, genres; durationSeconds і posterKey необов'язкові. DRAFT/NONE, автор із довіреного x-user-id.             |
| GET /admin/movies/:movieId           | Admin; бачить чернетки. Ендпоінт виведений зі сторінки редагування, як прямо вказано в KIN-190/G-12.                                 |
| PATCH /admin/movies/:movieId         | Admin; змінює тільки metadata; movieId і стани не приймаються; ABANDONED відхиляється. Optional duration/poster можна очистити null. |
| POST /admin/movies/:movieId/publish  | Запис PostgreSQL перед Meilisearch; тільки READY, DRAFT або SCHEDULED із часом, що настав.                                           |
| POST /admin/movies/:movieId/schedule | Майбутній ISO publishAt; DRAFT/SCHEDULED; PUBLISHED і ABANDONED відхиляються.                                                        |
| GET /movies/:movieId                 | Анонімний; тільки PUBLISHED; без original/master keys і upload credentials.                                                          |
| GET /movies/search?q=...             | Анонімний; trim, мінімум 2 символи, тільки PUBLISHED у Meilisearch.                                                                  |
| POST /movies/:movieId/watchlist      | Довірений caller; тільки PUBLISHED; повторення не створює дубля; userId у body ігнорується.                                          |
| DELETE /movies/:movieId/watchlist    | Видаляє тільки рядок caller; 204 також для відсутнього рядка.                                                                        |
| GET /watchlist                       | Масив caller; title/poster беруться join із поточного Movie, не зі snapshot. Порожній список — [].                                   |

Публікація повертає metadata і `catalogSaved: true`, `searchIndex: QUEUED | PENDING`, `message`. QUEUED означає прийняття асинхронного завдання Meilisearch, а не завершення індексації. PENDING означає, що каталог збережено, а індекс наздожене через наявний reconcile кожні 5 хвилин із перекриттям 24 години. Повторна publish опублікованого фільму безпечна й повторює upsert.

Publication worker виконується кожну хвилину, максимум 100 due READY записів за запуск, з умовним атомарним переходом у SQL. Майбутні й неготові записи лишаються SCHEDULED. Помилка одного запису не зупиняє решту; повторний запуск безпечний. Зворотних переходів публікації немає.

Клієнт: `/admin/movies` створює, `/admin/movies/:id/edit` читає/редагує чернетку; пошук має debounce 300 ms; watchlist доступний після входу. Відтворення, Rooms і повний S3/FFmpeg pipeline — наступні задачі, не критерій готовності цього каталожного спринту.

## Перевірки

```sh
pnpm typecheck
pnpm test
pnpm format:check
pnpm --filter @kinvue/movie test:migrations
pnpm --filter @kinvue/movie test:integration
```

Integration створює власний disposable PostgreSQL 16 на 55434 (`MOVIE_TEST_PORT` змінює порт), застосовує міграції двічі й перевіряє API/constraints та ізоляцію користувачів. Контейнер видаляється після тесту.

Для повного браузерного smoke: поруч має бути KinVue_Client з Playwright Chromium і запущеним клієнтом на 3000; окремі тестові PostgreSQL/Meilisearch мають бути доступні через Movie env. Після build Movie і Gateway виконайте `node services/movie/test/browser-smoke.cjs`. Скрипт займає локальні 4000/4003/4010 й закриває свої сервери. Він використовує RS256/JWKS Auth fixture, а решта шляху — справжні Gateway → Movie → PostgreSQL → Meilisearch. READY для тестового фільму готується через repository, без продуктового bypass endpoint. Використовуйте тільки тестові сервіси: скрипт створює й прибирає свій фільм; індекс має бути disposable.

Звіт: [2026-11-21](../verification/2026-11-21-sprint-3.md).
