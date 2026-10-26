# Стан робіт

Оновлюй цей файл, коли роботу завершено, покинуто або свідомо не зроблено. Журнал чатів при цьому не чисть.

## Зроблено

- Монорепозиторій pnpm, gateway і auth як окремі пакети.
- Вхід `POST /api/auth/google`: gateway приймає HTTP, auth перевіряє Google ID token по gRPC.
- Контракт `packages/shared-protos/proto/auth.proto` і генерація типів у `@kinvue/contracts`.
- Модель `AuthUser` у Prisma Next, міграції в `services/auth/migrations`.
- Пара JWT (access 15 хв, refresh 7 днів) без таблиці сесій.
- Локальний Postgres 16 у кореневому `docker-compose.yml` (порт 5432). Це база, яку читає auth.
- Локальний стенд `infra/docker-compose.yml` і приклад змінних у `.env.example`. Інструкція: `doc/runbooks/local-dev.md`. Код сервісів до стенда не підключений. Порти стенда не є прийнятою картою портів. На цій машині Meilisearch стенда не зайняв 7700: порт уже тримає інший проєкт.
- CI у файлі workflow: format check, typecheck контрактів і юніт-тести на `ubuntu-24.04`. На коміті lint-staged (Prettier) і `pnpm typecheck`. Повний тест і `nest build` на коміт не йдуть.
- Документообіг у `doc/` і однакові правила для Cursor, Claude та Codex.
- План розкладений на `doc/design/`, `doc/plan/`, `doc/backlog/`. Імпорт Jira прибраний в `doc/archive/jira-import/`.
- Правило здачі: гілка від `dev` і pull request. Прямий пуш у `dev` або `main` не є здачею.
- Стек цього репо: TypeScript, Node 24, pnpm, NestJS, `services/*`. Фронтенд в іншому репозиторії. CI runner — `ubuntu-24.04`. Сервіси розширюють `tsconfig.base.json`, [0018](decisions/0018-shared-typescript-and-checks.md).
- Анонімний пошук і картка опублікованих фільмів. In-app сповіщення в Postgres Notifications, дедуп за `eventId`, справжній push відкладений.
- Звіряння пошуку: 5 хв, перекриття 24 год, воркер публікації 60 с.
- Хостинг MVP: ≤ $300/міс, без Kubernetes. Нецілі v1 записані як заборона.
- Кореневий `.gitignore` ігнорує залежності, збірку, coverage, env-файли (крім `.env.example`), логи, звіти тестів і uploads.

## Не зроблено

- Сервіси `user`, `room`, `movie`, `chat`, `notification` — каркас Nest, продуктового коду немає.
- Збереження, ротація і відкликання refresh-токенів.
- Інші RPC і proto, крім `SignInWithGoogle`.
- ESLint у CI і на коміті вимкнений, доки `typescript-eslint` не підтримає TypeScript 7. Парсер зараз падає до перегляду файлів. Вимикати лінт назавжди не вирішували.
- CI/CD як шлюз злиття. Поки його немає, pull request усе одно обов'язковий.
- Решта плану: Users, Rooms, Movie, Notifications, медіа. Веб-клієнт — не цей репозиторій.
- Свідомо не робимо: Node 20 (лишається 24, KIN-131 відхилено), окремий runbook встановлення pnpm і Docker (уже є pnpm 10.34.4 і Docker, KIN-135 і KIN-137 відхилено), FFmpeg на хост ([0017](decisions/0017-no-host-ffmpeg.md), KIN-140 відхилено), Turborepo (KIN-159 відхилено), порожні каталоги `apps/` і чернетки структури з плану (KIN-157 відхилено, workspace уже `services/*` і `packages/*`).

## Відкладено

- Відкриті дірки плану: `doc/backlog/engineering/09-gaps-and-unknowns.md`. Їх не закривають побіжно. G-07 закрита [0011](decisions/0011-anonymous-published-movie-reads.md). FR-09 не реалізують, доки продукт не відповість, [0014](decisions/0014-defer-fr09-activity.md).
- Розбіжність термінів JWT: у коді refresh 7 днів без сховища, у плані 30 днів з ротацією.
- Карта портів як архітектурне рішення. Стенд у `infra/docker-compose.yml` лише приклад із тікетів KIN-171…KIN-214. Auth лишається на порту 5432, [0006](decisions/0006-postgres-16.md).
- Turborepo. `pnpm -r` вистачає, поки пакетів мало. KIN-159 закрито.

## Помічено, ще не вирішено

Це не контракт. Наступний агент не копіює цю поведінку в нові місця і не описує її як прийняте рішення.

- `services/auth` у `createIfNotExists` чекає ідентифікатор провайдера, а контролер передає сирий Google token.
- У відповідь `user_auth_id` контролер кладе запасне значення-заглушку, якщо немає id з токена. Не вирішено, чим є це поле: `AuthUser.id` чи Google `sub`.
