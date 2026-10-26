# 0018. Спільний TypeScript і де йдуть перевірки

- Статус: прийнято
- Дата: 2026-10-26
- Джерело: чат 2026-10-26, KIN-161, KIN-155, KIN-159
- Замінено: немає

## Контекст

KIN-161 просить один строгий `tsconfig`, який сервіси розширюють. KIN-159 просив Turborepo для тих самих команд. На коміті хук ганяв увесь `pnpm test` і форматування всього дерева. Це довго для локальної перевірки, а повна перевірка має жити в CI на pull request.

## Рішення

- Сервіси і пакети розширюють кореневий `tsconfig.base.json`. Опції компілятора туди не копіюють.
- У базі увімкнено `strict` і `noImplicitOverride`.
- `strictPropertyInitialization` вимкнено. Поля DTO і клієнти Nest заповнює декоратор, не тіло конструктора.
- `exactOptionalPropertyTypes` вимкнено. Поля `prop?: T` у DTO і наявний код присвоюють `undefined`, і цей прапор робить таке присвоєння помилкою.
- Локальний pre-commit: lint-staged (Prettier на змінених JS/TS) і `pnpm typecheck`. Тести, форматування всього дерева і `nest build` на коміт не ставлять.
- ESLint на коміт і в CI не вмикаємо, доки `typescript-eslint` не підтримає TypeScript 7. Зараз парсер падає на `ts.Extension`, бо peer дозволяє лише TypeScript нижче 6.1, а в репозиторії стоїть TypeScript 7.
- Ціль CI на pull request і на push у `main` та `dev`: `ubuntu-24.04`, `pnpm format:check`, `pnpm typecheck:contracts`, `pnpm test`. Окремого кроку `pnpm build` немає. Файл `.github/workflows/ci.yml` цим пушем не змінюється: GitHub відхиляє зміну workflow без scope `workflow` у токена. Щойно пуш можливий, у файл ставлять саме ці кроки.
- Turborepo не ставимо, KIN-159 відхилено. Це підтверджує [0010](0010-v1-stack-backend-repo.md).

## Порушення

Скопіювати строгі опції в tsconfig сервісу замість `extends`. Увімкнути `exactOptionalPropertyTypes` або `strictPropertyInitialization` без нового рішення. Повернути повний тест або збірку в pre-commit. Поставити Turborepo. Увімкнути `pnpm lint` у CI, доки парсер не вміє TypeScript 7: крок падатиме до перевірки коду.

## Наслідки

Коміт лишається коротким: тип перевіряється локально, тести і формат усього дерева — у CI, щойно файл workflow можна запушити.
