# Архітектура

Знімок коду на 2026-10-26. Цільовий план, з якого зібрані тікети, лежить у [design/](design/README.md). Оновлюй цей файл, коли змінюється картина системи, а не після кожного дрібного коміту.

## Ціль, якої ще немає в коді

HTTP API лишається на gateway. WebSocket кімнат іде прямо в Rooms. Відео віддає сховище і CDN, не сервіси. Чат у v1 живе в Rooms, не в `services/chat`. Профіль і друзі — у Users на MongoDB, каталог — у Movie на PostgreSQL, живий стан кімнати — у Redis. Пошук і картка опублікованого фільму — анонімні. Див. [0008](decisions/0008-target-ingress-and-plan.md) і [0011](decisions/0011-anonymous-published-movie-reads.md).

Rooms має погоджену власну PostgreSQL для довговічних запрошень/outbox і розкладів; живий стан і чат залишаються в Redis ([0022](decisions/0022-room-policy-gates.md), [0023](decisions/0023-rooms-durable-storage.md)). Це цільове рішення, не вже підключена база.

## Форма репозиторію

Це бекенд. Фронтенд — окремий репозиторій. Монорепозиторій pnpm на Node 24. Пакети: `services/*` і `packages/*`. Менеджер пакетів зафіксований у кореневому `package.json` (`pnpm@10.34.4`). Turborepo немає. Див. [0001](decisions/0001-pnpm-monorepo.md) і [0010](decisions/0010-v1-stack-backend-repo.md).

## Публічний край

Зараз клієнтський HTTP входить у `@kinvue/gateway` (NestJS). Окремого WebSocket і CDN у репозиторії ще немає.

- Префікс маршрутів: `api`. Порт береться з `PORT`.
- Тіло запиту перевіряє `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- CORS зі списку `ORIGINS`, увімкнені credentials. Додатково підключений helmet.
- Swagger збирається в `services/gateway/src/config/swagger`.
- На всі маршрути висять request id і логер запитів.

Див. [0002](decisions/0002-gateway-http-edge.md).

Зараз єдиний продуктовий маршрут gateway — `POST /api/auth/google`. Він передає Google token у auth по gRPC.

## Сервіси

| Пакет                                           | Роль зараз                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@kinvue/gateway`                               | Публічний HTTP                                                                                     |
| `@kinvue/auth`                                  | gRPC `auth.v1` на `0.0.0.0:50051`                                                                  |
| `@kinvue/contracts`                             | Proto і згенеровані типи (`packages/shared-protos`)                                                |
| `user`, `room`, `movie`, `chat`, `notification` | Порожній каркас Nest. Ім'я пакета досі `application`. Слухають `PORT ?? 3000`. Це не публічний API |

Між сервісами — gRPC, контракт у `@kinvue/contracts`. Див. [0003](decisions/0003-grpc-between-services.md) і [0004](decisions/0004-shared-contracts.md).

## Автентифікація

Auth перевіряє Google ID token (`GOOGLE_CLIENT_ID`), заводить рядок `AuthUser` і віддає пару JWT.

- Access живе 15 хвилин, секрет `JWT_ACCESS_SECRET`.
- Refresh живе 7 днів, секрет `JWT_REFRESH_SECRET`.
- У claims є `sub` і `role` (`USER` або `ADMIN`).
- Окремого сховища refresh-токенів немає: підпис без збереження.

Сховище auth — PostgreSQL через Prisma Next, не через класичну Prisma schema. Модель `AuthUser`: `id` (uuid), унікальний `email`, `role` за замовчуванням `USER`, унікальна пара `provider` + `providerUserId`.

Це поточна реалізація, а не нова політика. [0020](decisions/0020-auth-password-rs256-and-sessions.md) замінило 0005: Google зберігається, додаються парольний вхід, RS256 access 15 хв та refresh-сесії 30 днів із ротацією/відкликанням. [0021](decisions/0021-auth-policy-gates.md) визначає Argon2id, компенсацію та admin; [0025](decisions/0025-browser-session-storage.md) — cookie браузера. Реалізація цих змін ще не є частиною цього PR. Поля відповіді `user_auth_id` і те, що саме писати в `providerUserId`, ще не узгоджені — див. [status.md](status.md).

## Дані й перевірка

Локальний стек — один файл `docker-compose.yml`, [0019](decisions/0019-one-local-compose.md). База auth у ньому — Postgres 16, сервіс `postgres`, база `kinvue`, порт 5432, [0006](decisions/0006-postgres-16.md). У тому самому файлі є Postgres каталогу на 5434, Mongo, один Redis, RabbitMQ, Meilisearch, MinIO, Prometheus і Grafana. Сервіси Nest, крім auth, до цих сховищ ще не підключені. Порти стенда не є прийнятою картою портів. Як дивитись: [runbooks/local-dev.md](runbooks/local-dev.md).

CI на pull request і на push у `main` та `dev` ставить Node 24 на `ubuntu-24.04`, залежності з lockfile, ганяє `pnpm format:check`, `pnpm typecheck:contracts` і `pnpm test`. Окремого кроку `pnpm build` немає. Крок лінта закоментований: `typescript-eslint` 8.x не підтримує TypeScript 7, [0018](decisions/0018-shared-typescript-and-checks.md). Husky на коміті запускає lint-staged (Prettier для змінених JS/TS) і `pnpm typecheck`, потім commitlint. Повний тест і збірка на коміт не йдуть. Сервіси розширюють кореневий `tsconfig.base.json`.

Документообіг описаний у [0007](decisions/0007-document-workflow.md). Здавання змін — гілка від `dev` і pull request, [0009](decisions/0009-pull-request-from-dev.md). CI/CD як шлюз злиття ще не налаштований; наявний workflow перевіряє формат, типи контрактів і юніт-тести.

## Спільний фундамент першого спринту

Пакети config/logger/errors/JWT/testing незалежні від Nest. Config перевіряє поля до запуску listener; помилка містить лише назви полів. JWT verifier приймає готовий JWKS і не виконує мережевих запитів. `@kinvue/contracts` містить DTO та Zod-валідатори разом із наявним auth proto. Чат лишається частиною Rooms; API окремих Chat/Streaming не додається. Інструкція: [shared-packages](runbooks/shared-packages.md).
