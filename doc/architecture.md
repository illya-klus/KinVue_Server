# Архітектура

Знімок коду на 2026-10-26. Цільовий план, з якого зібрані тікети, лежить у [design/](design/README.md). Оновлюй цей файл, коли змінюється картина системи, а не після кожного дрібного коміту.

## Ціль, якої ще немає в коді

HTTP API лишається на gateway. WebSocket кімнат іде прямо в Rooms. Відео віддає сховище і CDN, не сервіси. Чат у v1 живе в Rooms, не в `services/chat`. Профіль і друзі — у Users на MongoDB, каталог — у Movie на PostgreSQL, живий стан кімнати — у Redis. Див. [0008](decisions/0008-target-ingress-and-plan.md).

## Форма репозиторію

Монорепозиторій pnpm. Пакети: `services/*` і `packages/*`. Менеджер пакетів зафіксований у кореневому `package.json` (`pnpm@10.34.4`). Див. [0001](decisions/0001-pnpm-monorepo.md).

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

Див. [0005](decisions/0005-auth-google-prisma-next.md). Поля відповіді `user_auth_id` і те, що саме писати в `providerUserId`, ще не узгоджені — див. [status.md](status.md).

## Дані й перевірка

Локальна база — Postgres 16 з `docker-compose.yml` (сервіс `postgres`, база `kinvue`, порт 5432). Див. [0006](decisions/0006-postgres-16.md).

CI на pull request і на push у `main` та `dev` ставить залежності з lockfile, ганяє `pnpm format:check` і `pnpm typecheck:contracts`. Крок лінта в workflow закоментований. Husky на коміті запускає lint-staged (Prettier і ESLint для змінених JS/TS) і commitlint.

Документообіг описаний у [0007](decisions/0007-document-workflow.md). Здавання змін — гілка від `dev` і pull request, [0009](decisions/0009-pull-request-from-dev.md). CI/CD як шлюз злиття ще не налаштований; наявний workflow лише перевіряє формат і типи контрактів.
