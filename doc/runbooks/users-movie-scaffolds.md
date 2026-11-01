# Каркаси Users і Movie

Пакети лишаються в `services/user` (`@kinvue/users`) та `services/movie` (`@kinvue/movie`) за рішенням 0010. Шляхи `apps/users-service` та `apps/movie-service` в KIN-61/70 — застарілі приклади з плану.

Потрібні Node 24 і pnpm 10.34.4 з package.json. З кореня: `pnpm install --frozen-lockfile`, `pnpm build:shared`. Конфіг задайте змінними середовища процесу або у `.env` у робочій директорії сервісу. Справжні значення й секрети в Git не додавайте.

| Сервіс | Обов'язкові змінні                                                 | Адреса діагностики за замовчуванням | Override                             |
| ------ | ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------ |
| Users  | `USERS_MONGO_URL`                                                  | `127.0.0.1:4002`                    | `USERS_HTTP_HOST`, `USERS_HTTP_PORT` |
| Movie  | `MOVIE_DATABASE_URL`, `MEILISEARCH_HOST`, `MEILISEARCH_MASTER_KEY` | `127.0.0.1:4003`                    | `MOVIE_HTTP_HOST`, `MOVIE_HTTP_PORT` |

Meilisearch лишається в уже наявній спільній схемі Movie, але readiness каркаса перевіряє тільки власну PostgreSQL. Users перевіряє MongoDB `ping`, Movie — `SELECT 1`. Клієнти ліниві, з обмеженими таймаутами: процес і live можуть працювати під час відмови БД. Shutdown закриває клієнти. Публічних продуктових HTTP-маршрутів у цих каркасах немає; міжсервісний gRPC додаватиметься окремими задачами.

Запуск:

```sh
pnpm --filter @kinvue/users start:dev
pnpm --filter @kinvue/movie start:dev
```

Діагностика обох сервісів:

- `GET /health/live` — 200 незалежно від стану БД.
- `GET /health/ready` — 200 при успішній перевірці власної БД, інакше 503 зі спільним `UPSTREAM_UNAVAILABLE` без подробиць з'єднання.
- `GET /metrics` — текст Prometheus.
- Невідомий маршрут — спільний JSON `NOT_FOUND`; `x-request-id` повертається як requestId.

Перевірка коду:

```sh
pnpm build:shared
pnpm --filter @kinvue/users build
pnpm --filter @kinvue/movie build
pnpm --filter @kinvue/users test --runInBand
pnpm --filter @kinvue/movie test --runInBand
pnpm --filter @kinvue/users test:e2e --runInBand
pnpm --filter @kinvue/movie test:e2e --runInBand
pnpm --filter @kinvue/users test:process
pnpm --filter @kinvue/movie test:process
```

Unit та HTTP e2e перевіряють 200/503/відновлення і формат помилок через контрольований readiness provider. Це не перевірка справжньої БД. Для ручного smoke підніміть єдиний кореневий Compose згідно з local-dev.md, запустіть сервіси зі своїми URL, перевірте ready=200, зупиніть відповідну БД, перевірте ready=503 і live=200, після відновлення БД перевірте ready=200.

Контейнери збираються з **кореневого** контексту workspace:

```sh
docker build -f docker/user/Dockerfile -t kinvue-users:sprint1 .
docker build -f docker/movie/Dockerfile -t kinvue-movie:sprint1 .
```

Обидва образи мають production stage на Node 24 і `USER node`, включають `dist` через files у package.json, слухають `0.0.0.0` лише всередині контейнера. Публікуйте діагностичні порти лише на `127.0.0.1` локально; у розгортанні сервіси мають лишатися приватними. `HEALTHCHECK` читає фактичний service HTTP port. `.dockerignore` виключає `.env`, `.env.*`, ключі, node_modules і локальну збірку; образ збирає код сам. При запуску потрібно передати обов'язкові змінні; імена БД у контейнерній мережі відрізняються від localhost на хості.

Docker build/run ще потрібно перевірити у середовищі з Docker. Наявність Dockerfile або успішна локальна Nest-збірка не доводять виконання критеріїв KIN-68/77.
