# 0019. Один локальний Compose

- Статус: прийнято
- Дата: 2026-10-27
- Джерело: чат 2026-10-27
- Замінено: немає

## Контекст

Локальні сховища описували два файли: кореневий `docker-compose.yml` з базою auth і `infra/docker-compose.yml` з другим Postgres для auth. Друга база нічого не читала. [0006](0006-postgres-16.md) лишається про рушій і саму базу auth.

## Рішення

- Локальний стек — один файл, кореневий `docker-compose.yml`.
- База auth у цьому файлі — сервіс `postgres`, база `kinvue`, порт `5432`, як у [0006](0006-postgres-16.md).
- Movie Postgres, Mongo, Redis, RabbitMQ, Meilisearch, MinIO, Prometheus і Grafana живуть у тому самому файлі.
- `pnpm infra:up`, `infra:down` і `infra:logs` запускають цей файл.

## Порушення

Другий compose для локальних сховищ. Другий Postgres для auth. Окремий файл `infra/docker-compose.yml` або `docker/compose/docker-compose.yml` як ще одне визначення стека.

## Наслідки

Порт 5433 і база `kinvue_auth` не є локальним сховищем auth. Каталог фільмів лишається окремим сервісом `movie-postgres` на порту 5434: це інша база, не друга копія auth.
