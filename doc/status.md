# Стан робіт

Оновлюй цей файл, коли роботу завершено, покинуто або свідомо не зроблено. Журнал чатів при цьому не чисть.

## Поточний зріз — 2026-11-22

Jira показує призначені Богдану задачі в усіх спринтах. Історичні розділи нижче описують попередню роботу, а актуальні PR та блокери наведено тут.

- Server PR #40–#52 змерджені в `dev`; відкритих Server PR немає. У PR #46 додано Gateway regression приватного входу та Rooms regression owner-only зміни ролей; у PR #50 — profile read із токеном, виданим до перезапуску Auth; у PR #52 — авторизований roster кімнати з ролями та присутністю. Цільові тести, типізація і CI пройшли.
- Після перевірених і злитих PR у `Done` проведено KIN-101, KIN-105, KIN-109, KIN-120, KIN-124, KIN-134, KIN-136, KIN-138, KIN-139, KIN-142, KIN-143, KIN-145, KIN-147, KIN-172, KIN-176, KIN-179, KIN-195, KIN-199, KIN-203, KIN-208, KIN-217, KIN-221, KIN-228, KIN-281, KIN-324, KIN-326, KIN-328, KIN-330, KIN-332, KIN-334, KIN-336, KIN-338 і KIN-340.
- KIN-213 лишається `In Progress`: немає playback-control handler із перевіркою ролі та підписаного media-access endpoint.
- KIN-54 лишається `In Testing (by agent)` до фактичного Auth Docker image smoke. Docker Desktop після restart лишився у `starting`, а Windows service `com.docker.service` зупинений; запуск сервісу відхилено через відсутність доступу. Раніше Grafana API повернула три dashboards, але зараз Prometheus/Grafana endpoints timeout; Rooms `/metrics` і поточну доступність dashboards не підтверджено. Деталь записана в KIN-346.
- KIN-342, KIN-344 і KIN-346 лишаються `In Progress`; повне приймання не завершене. Client PR #3 (KIN-141), #4 (KIN-248/KIN-251) і #5 (KIN-243 browser journey) змерджені в `main`; усі чотири тікети в `In Testing (by agent)` до перевірки з живим стеком. Лишаються відкритими KIN-247, KIN-250, KIN-264, KIN-268, KIN-272, KIN-275, KIN-279 і KIN-290.
- KIN-285 потребує рішення про хостинг і секрети; MVP release tag KIN-347 не створювати до успішного приймання.

## Зроблено

- Монорепозиторій pnpm, gateway і auth як окремі пакети.
- Вхід `POST /api/auth/google`: gateway приймає HTTP, auth перевіряє Google ID token по gRPC.
- Контракт `packages/shared-protos/proto/auth.proto` і генерація типів у `@kinvue/contracts`.
- Модель `AuthUser` у Prisma Next, міграції в `services/auth/migrations`.
- Пара JWT (access 15 хв, refresh 7 днів) без таблиці сесій.
- Один локальний Compose: кореневий `docker-compose.yml`, [0019](decisions/0019-one-local-compose.md). База auth — сервіс `postgres`, порт 5432. У тому самому файлі каталог, Mongo, Redis, RabbitMQ, Meilisearch, MinIO, Prometheus і Grafana. Інструкція: `doc/runbooks/local-dev.md`. Другої бази auth немає. Увесь стенд, включно з Meilisearch, піднятий і healthy.
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

- Приймання Users у Sprint 2 ще попереду. Реалізація й перевірки описані нижче; підключення внутрішнього створення профілю до реальної саги Auth залишається окремою інтеграцією.
- Перший спринт Богдана: PR #10, #11 і #12 змерджені в `dev`; CI PR #12 пройшов. KIN-54 і KIN-228 лишаються в In Testing (by agent), доки не завершено Docker image build/run smoke. Попередня спроба була зупинена через нестачу місця на диску C; на 2026-11-21 лишалося 632 MB.
- Збереження, ротація і відкликання refresh-токенів.
- Інші RPC і proto, крім `SignInWithGoogle`.
- ESLint у CI і на коміті вимкнений, доки `typescript-eslint` не підтримає TypeScript 7. Парсер зараз падає до перегляду файлів. Вимикати лінт назавжди не вирішували.
- CI/CD як шлюз злиття. Поки його немає, pull request усе одно обов'язковий.
- Решта плану: Users, Rooms, Movie, Notifications, медіа. Веб-клієнт — не цей репозиторій.
- Свідомо не робимо: Node 20 (лишається 24, KIN-131 відхилено), окремий runbook встановлення pnpm і Docker (уже є pnpm 10.34.4 і Docker, KIN-135 і KIN-137 відхилено), FFmpeg на хост ([0017](decisions/0017-no-host-ffmpeg.md), KIN-140 відхилено), Turborepo (KIN-159 відхилено), порожні каталоги `apps/` і чернетки структури з плану (KIN-157 відхилено, workspace уже `services/*` і `packages/*`).

## Відкладено

- Sprint 2 (Auth, Богдан): KIN-291 та KIN-296 у [PR #16](https://github.com/illya-klus/KinVue_Server/pull/16): обов'язковий RSA signing key, публічний JWKS endpoint, RS256 access токени з `sub/iss/aud/iat/exp/userId/scopes`. JWKS/access-token тести, повний root `pnpm test`, typecheck і форматування проходять локально. Перша CI перевірка виявила застарілі fixtures після вимоги нових env keys; виправлено конфіг тест, CI має перезапуститися.
- Sprint 2 (Auth, Богдан): KIN-289 реалізовано в [PR #15](https://github.com/illya-klus/KinVue_Server/pull/15), статус `In Testing (by agent)`: Argon2id функції hash/verify використовують узгоджені параметри з рішення 0021; локальні unit-тести та Auth typecheck проходять. CI PR очікує завершення.
- Sprint 2 (Auth, Богдан): KIN-271 реалізовано та передано в `Verifying (by developer)` у [PR #14](https://github.com/illya-klus/KinVue_Server/pull/14); перевірки PR пройшли. Для KIN-276/280/284 додано `auth_identities`, `refresh_sessions`, `auth_outbox_events` через Prisma Next міграцію: PK і email/status constraints, refresh hash/expiry/revocation/rotation, потрібні індекси, JSONB outbox payload. KIN-287 автоматизовано disposable Docker PostgreSQL тестом. Усі чотири задачі пройшли локальний integration test на свіжій PostgreSQL 15, повний `pnpm typecheck` і форматування; вони передані в `In Testing (by agent)` у PR #14. Тест за замовчуванням налаштований на PostgreSQL 16:5433, але локально використано вже наявний образ PostgreSQL 15 та порт 55433, бо 5433 зайнятий контейнером користувача. Перевірку на дефолтних PG16/5433 ще треба зробити.

- Відкриті дірки плану: `doc/backlog/engineering/09-gaps-and-unknowns.md`. Їх не закривають побіжно. G-07 закрита [0011](decisions/0011-anonymous-published-movie-reads.md). FR-09 не реалізують, доки продукт не відповість, [0014](decisions/0014-defer-fr09-activity.md).
- Політику JWT погоджено у 0020: access 15 хв, refresh 30 днів з ротацією. Реалізація поки лишається старою (refresh 7 днів без сховища).
- Карта портів як архітектурне рішення. Порти в `docker-compose.yml` — локальний приклад. Auth лишається на порту 5432, [0006](decisions/0006-postgres-16.md).
- Turborepo. `pnpm -r` вистачає, поки пакетів мало. KIN-159 закрито.

## Помічено, ще не вирішено

Це не контракт. Наступний агент не копіює цю поведінку в нові місця і не описує її як прийняте рішення.

- `services/auth` у `createIfNotExists` чекає ідентифікатор провайдера, а контролер передає сирий Google token.
- У відповідь `user_auth_id` контролер кладе запасне значення-заглушку, якщо немає id з токена. Не вирішено, чим є це поле: `AuthUser.id` чи Google `sub`.

## Перший спринт Богдана, 2026-10-28

Погоджено 25 призначених тікетів KIN Sprint 1 (sprint 1), три PR у dev: рішення 0020–0025; shared-пакети й DTO; каркаси Auth/Rooms із діагностикою, Docker та резервним WS-портом. Парольний Auth, бізнес-логіка Rooms і решта наступних спринтів не входять у ці три PR. Попередню ширшу незакомічену роботу збережено у backup ref `refs/backup/sprint-1-full-20261028` і локальному архіві. Веб відкладено до отримання репозиторію.

Рішення задокументовано; це не свідчення завершення продуктових реалізацій. Тікети проходять In Progress → In Testing (by agent) → Verifying (by developer) за фактичними перевірками та PR. Done потребує приймання.

Shared-поставка першого спринту: `@kinvue/config`, `@kinvue/logger`, `@kinvue/errors`, `@kinvue/jwt`, `@kinvue/testing` і DTO-схеми `@kinvue/contracts`. Продуктовий Auth лишається Google/HMAC; нові пакети не означають виконання наступних спринтів.

## Перший спринт Анатолія, 2026-11-01

Обсяг: 13 призначених задач активного KIN Sprint 1. Зміни запушені окремою гілкою від dev та передані через [PR #13 у dev](https://github.com/illya-klus/KinVue_Server/pull/13).

| Задачі                                                 | Результат                                                                                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KIN-40, KIN-44, KIN-48, KIN-67, KIN-75, KIN-81, KIN-87 | Користувач явно погодив пакет; політики записані як прийняте [0026](decisions/0026-sprint-1-users-movie-policies.md), username збережений за 0024. G-06/C-02/C-08 закриті. |
| KIN-61, KIN-64                                         | @kinvue/users у services/user: HTTP 4002, конфіг, JSON-логи, safe errors, live/ready/metrics, MongoDB ping; відновлює підключення після початкової відмови БД.             |
| KIN-70, KIN-74                                         | @kinvue/movie у services/movie: HTTP 4003, конфіг, JSON-логи, safe errors, live/ready/metrics; SELECT 1 у власній PostgreSQL.                                              |
| KIN-68, KIN-77                                         | Docker build/run пройшли в тимчасовому Linux Sandbox: Node 24, USER node/uid 1000, production deploy, HEALTHCHECK, відсутні .env у /app.                                   |

Пройдено shared/Nest build, workspace typecheck, повний набір тестів (44 після регресійного тесту), Users/Movie HTTP e2e і процесні smoke, форматування та frozen lockfile. CI коду 29f2ace пройшов. Справжні MongoDB 7/PostgreSQL 16 підтвердили ready=503 → 200 → 503 → 200 без перезапуску сервісів; live лишався 200 при відмові БД. Виправлено виявлене контейнерним тестом зависання Users у 503 після першого невдалого неявного підключення MongoDB. [Звіт перевірки](verification/2026-11-01-users-movie.md).

У Jira всі 13 задач проведені через In Progress та In Testing (by agent) до Verifying (by developer), із посиланням на PR. KIN-61/64 додатково поверталися на тестування після знайденої помилки й знову передані на рев'ю після виправлення. Done потребує приймання.

Блокери push і Docker усунуті: після підтвердження користувача використано GitHub CLI та тимчасовий непостійний Vercel Sandbox. Docker/WSL на Windows не встановлювали. Попередні невдалі спроби та їх причини лишаються в журналі дня.

Наявне обмеження lint підтверджене: typescript-eslint 8.64.0 падає на TypeScript 7 до аналізу файлів (0018). CI, версії TypeScript і політику build scripts не змінювали. Продуктові API, репозиторії даних та медіаворкер залишаються задачами наступних спринтів. Runbook: [users-movie-scaffolds](runbooks/users-movie-scaffolds.md).

## Sprint 2: Users, 2026-11-16

Реалізовано профілі, пошук, дружбу та транзакційний outbox для KIN-29, KIN-32, KIN-35, KIN-38, KIN-41, KIN-45, KIN-49, KIN-53, KIN-331, KIN-333, KIN-335, KIN-337, KIN-339, KIN-341, KIN-343, KIN-345. Клієнт отримує наступні сторінки пошуку й списків дружби через Gateway. Виправлено старт і передачу JSON-запитів через наявний middleware Gateway. Див. [runbook](runbooks/users-sprint-2.md) і [журнал](log/2026-11-16.md).

Sprint 2 Users здано: [Server PR #27 у dev](https://github.com/illya-klus/KinVue_Server/pull/27) і [Client PR #1 у main](https://github.com/illya-klus/KinVue_Client/pull/1) змерджені 2026-11-21. Обмеження авторизації Git та історія публікації описані в [журналі](log/2026-11-19.md).

## Sprint 4: Rooms, 2026-11-21

Реалізовано KIN-101, KIN-105, KIN-109 і KIN-134 у гілці `feat/sprint-4-rooms`: Redis-модель кімнати/учасників, створення приватної чи публічної кімнати, список активних публічних кімнат і закриття лише власником. Застосовано TTL 6 годин, після закриття — 15 хвилин; створений власник має `OWNER/ONLINE`, відтворення — `PAUSED` на позиції 0. Валідація, Lua-атомарні операції та тести є в коді. Redis 7 HTTP smoke пройшов на одноразовому контейнері; root `pnpm format:check`, `pnpm typecheck`, `pnpm test` і PR CI (compose-health, форматування, unit-тести, typecheck) пройшли. [PR #28](https://github.com/illya-klus/KinVue_Server/pull/28) очікує рев’ю/злиття; ці чотири задачі в `Verifying (by developer)`. Клієнтський KIN-243 (сторінка публічних кімнат і перехід до кімнати) вже в `main`, build та Playwright CI пройшли; тікет у `In Testing (by agent)` до інтеграції API з PR #28. Docker image build окремо не запускався через 632 MB вільного місця на C:. Запрошення/outbox, місткість 20, WebSocket, KIN-147 повний lifecycle і решта клієнтських задач залишаються відкритими.
