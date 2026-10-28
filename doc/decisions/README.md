# Рішення

Зобов'язуючі рішення. Дрібниці з одного чату живуть у [журналі](../log/README.md), не тут.

Новий запис: наступний номер, файл `NNNN-slug.md` за [шаблоном](../templates/decision.md), рядок у таблиці.

Статуси: `запропоновано`, `прийнято`, `відхилено`, `відкладено`, `замінено`.

Рішення 0001–0006 зчитані з репозиторію 2026-10-26, окремого чату про них не було. 0007–0009 прийняті в чатах того ж дня. 0008 частково замінює формулу «єдині двері — gateway» з 0002. 0010 фіксує стек цього бекенд-репо і Node 24 замість Node 20 з плану. 0017 відхиляє FFmpeg на машині розробника. 0018 фіксує спільний TypeScript і те, що повна перевірка йде в CI, а не на кожен коміт. 0019 лишає один локальний Compose і не заводить другу базу auth.

| Номер                                            | Статус   | Рішення                                         |
| ------------------------------------------------ | -------- | ----------------------------------------------- |
| [0001](0001-pnpm-monorepo.md)                    | прийнято | Монорепозиторій на pnpm                         |
| [0002](0002-gateway-http-edge.md)                | прийнято | HTTP API входить у gateway                      |
| [0003](0003-grpc-between-services.md)            | прийнято | Між сервісами — gRPC                            |
| [0004](0004-shared-contracts.md)                 | прийнято | Спільні контракти в `@kinvue/contracts`         |
| [0005](0005-auth-google-prisma-next.md)          | замінено | Google sign-in, JWT і Prisma Next; див. 0020    |
| [0006](0006-postgres-16.md)                      | прийнято | PostgreSQL 16 для даних auth                    |
| [0007](0007-document-workflow.md)                | прийнято | Журнал рішень і стоп при порушенні              |
| [0008](0008-target-ingress-and-plan.md)          | прийнято | Три входи і план як ціль                        |
| [0009](0009-pull-request-from-dev.md)            | прийнято | Гілка від dev і pull request                    |
| [0010](0010-v1-stack-backend-repo.md)            | прийнято | Стек v1, бекенд-репо, Node 24                   |
| [0011](0011-anonymous-published-movie-reads.md)  | прийнято | Анонімний пошук і картка опублікованих          |
| [0012](0012-search-reconciliation-cadence.md)    | прийнято | Звіряння пошуку 5 хв / перекриття 24 год        |
| [0013](0013-notification-channels-and-dedup.md)  | прийнято | In-app Postgres, дедуп, push відкладений        |
| [0014](0014-defer-fr09-activity.md)              | прийнято | FR-09 не будують, доки продукт не назве         |
| [0015](0015-mvp-hosting-class.md)                | прийнято | Хостинг MVP ≤ $300, без Kubernetes              |
| [0016](0016-v1-non-goals.md)                     | прийнято | Заборона нецілей v1                             |
| [0017](0017-no-host-ffmpeg.md)                   | прийнято | FFmpeg не ставимо на машину розробника          |
| [0018](0018-shared-typescript-and-checks.md)     | прийнято | Спільний TypeScript і перевірки в CI            |
| [0019](0019-one-local-compose.md)                | прийнято | Один локальний Compose                          |
| [0020](0020-auth-password-rs256-and-sessions.md) | прийнято | Парольний вхід, RS256 і refresh-сесії           |
| [0021](0021-auth-policy-gates.md)                | прийнято | Параметри пароля, компенсація й перший admin    |
| [0022](0022-room-policy-gates.md)                | прийнято | TTL, ролі, heartbeat і приватні запрошення      |
| [0023](0023-rooms-durable-storage.md)            | прийнято | Rooms PostgreSQL для outbox і розкладу          |
| [0024](0024-registration-username-policy.md)     | прийнято | Нормалізація й обмеження username               |
| [0025](0025-browser-session-storage.md)          | прийнято | HttpOnly refresh, access у пам'яті й invite URL |
