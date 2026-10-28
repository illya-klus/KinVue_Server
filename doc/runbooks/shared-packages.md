# Спільні пакети

Потрібні Node 24 і pnpm із кореневого package.json. Після checkout: `pnpm install --frozen-lockfile`, `pnpm build:shared`. Кореневі `pnpm typecheck` і `pnpm test` самі збирають shared перед перевірками.

## Config, logger, errors, JWT

Викликайте `loadEnvironmentConfig(authConfigSchema)` (або схему свого сервісу) **до** створення Nest application/listener. Кожен із восьми контрактів лежить у `packages/config/src/schemas/`. Відсутні/невалідні значення дають ConfigError тільки з назвами полів; env та raw Zod error не логують. Auth у першому спринті ще вимагає HMAC secrets для наявного Google-входу; перехід на RS256 буде окремою продуктовою зміною.

`createLogger("auth").info("request", { requestId, userId, route, durationMs })` пише один JSON-рядок. Секретні ключі, вкладені токени, Bearer, JWT, паролі, credentials у URL та private key редагуються. Не передавайте повний config/body у лог навіть із цим захистом.

`AppError` і `errorResponse` визначають спільні коди HTTP. Для неочікуваної помилки повертається INTERNAL без stack/cause; адаптер Nest живе у сервісі. Повідомлення AppError має бути безпечним для клієнта.

`createJwtVerifier(jwks, { issuer, audience })` повертає локальну async-функцію `(token, requiredScopes)`. Вона перевіряє RS256, kid, signature, exp/iat/nbf, issuer, audience і scopes та повертає userId/scopes. Невідомий kid відхиляється з UNKNOWN_KEY. Отримання/оновлення JWKS виконує споживач; усередині verifier мережі немає.

## Contracts

DTO та Zod-схеми експортуються з `@kinvue/contracts`. Джерело: `packages/shared-protos/src/schemas.ts`; приклади тіл і негативні сценарії: `packages/shared-protos/test/schemas.test.cjs`. Це форми запитів і подій, а не реалізація маршрутів. Реєстрація нормалізує username/displayName за погодженою 0024, пароль не змінюється. Scope/owner/capacity, унікальність і перевірка майбутнього часу — обов'язок відповідного feature-сервісу.

## Testing

Для destructive cleanup необхідний `NODE_ENV=test`. PostgreSQL/Mongo database має починатися з `test_` або закінчуватися `_test`; фактичне ім'я перевіряється перед видаленням. Передавайте окремий підключений `pg.Client`, не Pool. PostgreSQL очищає explicit schema без CASCADE, зберігає таблиці міграцій; Mongo видаляє документи, зберігаючи індекси. Власний test database на кожен паралельний suite запобігає конфліктам.

Redis helper сумісний з ioredis; використовуйте `testRedisPrefix(runId)` та тільки ключі цього префікса. Він застосовує SCAN/DEL, ніколи FLUSHDB. Не передавайте спільний префікс різним тестам.

`userFixture()` дає унікальні UUID/email/username, `movieFixture()` — незалежний фільм. `httpClient(origin, { token })` надсилає JSON та відхиляє переходи на інший origin і redirects, щоб не переслати credentials сторонньому серверу. Cleanup helpers перевірені unit-тестами з контрольованими клієнтами; це не свідчення запуску справжніх БД.
