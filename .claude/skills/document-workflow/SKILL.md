---
name: document-workflow
description: >-
  Logs every chat decision into doc/log, records binding decisions in
  doc/decisions, and updates doc/status.md and doc/architecture.md. Stops
  and tells the user before a change that contradicts an accepted
  architecture decision. Use on any KinVue Server task that decides,
  implements, defers, or rejects work, and before edits to services,
  contracts, auth, storage, or infrastructure. Also use when finishing
  any KinVue Server change: branch from dev and open a pull request.
---

# Документообіг

Спочатку прочитай `doc/AGENT.md` і виконай його. Цей скіл лише тримає порядок кроків. Канон важливіший за цей файл.

Такі самі кроки мають виконати Cursor, Claude і Codex. Не заводи окремий журнал під одного агента.

## Перед архітектурною правкою

1. Прочитай `doc/architecture.md`, `doc/status.md`, `doc/decisions/README.md`.
2. Якщо зміна б'є рішення зі статусом `прийнято` — зупинись, назви номер і наслідок, чекай явну згоду.
3. Після згоди створи нове рішення і познач старе `замінено`.

## Git

Завжди здавай роботу гілкою від `dev` і pull request у `dev`. Якщо зміни вже на `dev`, перенеси їх на нову гілку до коміту. У `dev` і `main` не пуш. Force push не роби. CI/CD як шлюз ще немає і не є причиною пропустити pull request. Деталі: `doc/decisions/0009-pull-request-from-dev.md`.

## У кінці чату, де щось вирішили

1. Допиши секцію в `doc/log/YYYY-MM-DD.md` за `doc/templates/session-log.md`. Історію не переписуй.
2. Зобов'язуюче рішення — новий `doc/decisions/NNNN-slug.md` за `doc/templates/decision.md` і рядок в `doc/decisions/README.md`. Номер на одиницю більший за найбільший наявний.
3. Онови `doc/status.md`. Якщо змінилася картина системи — `doc/architecture.md`.
4. Секрети і вміст `.env` не записуй.
