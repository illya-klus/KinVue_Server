# Стан робіт

Оновлюй цей файл, коли роботу завершено, покинуто або свідомо не зроблено. Журнал чатів при цьому не чисть.

## Зроблено

- Монорепозиторій pnpm, gateway і auth як окремі пакети.
- Вхід `POST /api/auth/google`: gateway приймає HTTP, auth перевіряє Google ID token по gRPC.
- Контракт `packages/shared-protos/proto/auth.proto` і генерація типів у `@kinvue/contracts`.
- Модель `AuthUser` у Prisma Next, міграції в `services/auth/migrations`.
- Пара JWT (access 15 хв, refresh 7 днів) без таблиці сесій.
- Локальний Postgres 16 у `docker-compose.yml`.
- CI: format check і typecheck контрактів. Husky, lint-staged, commitlint.
- Документообіг у `doc/` і однакові правила для Cursor, Claude та Codex.
- План розкладений на `doc/design/`, `doc/plan/`, `doc/backlog/`. Імпорт Jira прибраний в `doc/archive/jira-import/`.
- Правило здачі: гілка від `dev` і pull request. Прямий пуш у `dev` або `main` не є здачею.

## Не зроблено

- Сервіси `user`, `room`, `movie`, `chat`, `notification` — каркас Nest, продуктового коду немає.
- Збереження, ротація і відкликання refresh-токенів.
- Інші RPC і proto, крім `SignInWithGoogle`.
- ESLint у CI: скрипт `pnpm lint` є, крок у `.github/workflows/ci.yml` закоментований. Вимикати лінт назавжди не вирішували.
- CI/CD як шлюз злиття. Поки його немає, pull request усе одно обов'язковий.
- Решта плану: Users, Rooms, Movie, Notifications, медіа, веб-клієнт.

## Відкладено

- Відкриті дірки плану: `doc/backlog/engineering/09-gaps-and-unknowns.md`. Їх не закривають побіжно.
- Розбіжність термінів JWT: у коді refresh 7 днів без сховища, у плані 30 днів з ротацією.
- Розбіжність Node: workflow ставить 24, текст плану пише 20. Пайплайн цим завданням не змінювали.

## Помічено, ще не вирішено

Це не контракт. Наступний агент не копіює цю поведінку в нові місця і не описує її як прийняте рішення.

- `services/auth` у `createIfNotExists` чекає ідентифікатор провайдера, а контролер передає сирий Google token.
- У відповідь `user_auth_id` контролер кладе запасне значення-заглушку, якщо немає id з токена. Не вирішено, чим є це поле: `AuthUser.id` чи Google `sub`.
