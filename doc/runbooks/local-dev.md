# Локальний стек

Усе локальне оточення — один файл `docker-compose.yml` у корені. Другого compose немає. Сервіси Nest у цьому файлі не запускаються: тут лише сховища, черга, пошук і метрики.

База auth — сервіс `postgres`, порт **5432**, база `kinvue`. Це [0006](../decisions/0006-postgres-16.md). Код читає `DATABASE_URL`. `AUTH_DATABASE_URL` у `.env.example` вказує на ту саму базу. Окремого Postgres на 5433 немає, [0019](../decisions/0019-one-local-compose.md).

Паролі в цей файл не копіюй. Локальний приклад змінних лежить у `.env.example`.

## Як це складено

Контейнери одного проєкту Compose. Між собою вони бачать імена сервісів у мережі `kinvue-data`. З неї немає виходу в інтернет. Мережа `kinvue-edge` публікує порти на `localhost`.

| Контейнер               | Порт на машині         | Для чого в KinVue                                                                                                                         |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `kinvue-postgres`       | 5432                   | База auth. Її читає сервіс auth.                                                                                                          |
| `kinvue-movie-postgres` | 5434                   | Каталог фільмів. Окремий том, інша база, не копія auth.                                                                                   |
| `kinvue-users-mongo`    | 27017                  | Майбутні профілі. База в URL: `kinvue_users`. Локально без логіна.                                                                        |
| `kinvue-rooms-redis`    | 6379                   | Живий стан кімнати. Один вузол. Це не кластер і не запасний Redis для продакшену.                                                         |
| `kinvue-rabbitmq`       | 5672, панель 15672     | Черги між сервісами. Логін зі змінних.                                                                                                    |
| `kinvue-meilisearch`    | 7700                   | Пошук фільмів. Один вузол. Ключ лише зі змінної.                                                                                          |
| `kinvue-minio`          | API 9000, консоль 9001 | Файли медіа. Бакет `kinvue-media` не відкритий на читання всім. Образ `pgsty/minio`, бо офіційний `minio/minio` без логіна не скачується. |
| `kinvue-prometheus`     | 9090                   | Збір метрик. Конфіг порожній: `scrape_configs: []`.                                                                                       |
| `kinvue-grafana`        | 3001                   | Графіки. Всередині контейнера порт 3000, назовні 3001.                                                                                    |

`kinvue-minio-init` один раз створює бакет і зупиняється. Це норма.

## Команди

З кореня репозиторію:

```powershell
pnpm infra:up
pnpm infra:logs
pnpm infra:down
```

`infra:up` читає `.env.example` і піднімає кореневий `docker-compose.yml`. Щоб підставити свої значення, скопіюй приклад у `.env` і запускай ту саму команду з `--env-file .env`.

Стан: `docker compose --env-file .env.example ps`.

## Куди дивитись

- Auth Postgres: `docker exec kinvue-postgres pg_isready -U kinvue -d kinvue`.
- Каталог: `docker exec kinvue-movie-postgres pg_isready -U kinvue_movie -d kinvue_movie`.
- Mongo: `docker exec kinvue-users-mongo mongosh --quiet --eval "db.getSiblingDB('kinvue_users').runCommand({ ping: 1 })"`.
- Redis: `docker exec kinvue-rooms-redis redis-cli ping` відповідає `PONG`.
- RabbitMQ: `http://localhost:15672`. Логін — `RABBITMQ_USER` і `RABBITMQ_PASSWORD` з env-файлу.
- Meilisearch: `http://localhost:7700/health`.
- MinIO: API `http://localhost:9000`, консоль `http://localhost:9001`.
- Prometheus: `http://localhost:9090`. Targets порожні, бо збирати ще ні з кого.
- Grafana: `http://localhost:3001`. Логін — `GRAFANA_ADMIN_USER` і `GRAFANA_ADMIN_PASSWORD` з env-файлу.

## Що навмисно одне

- Один файл Compose. `infra/docker-compose.yml` і `docker/compose/docker-compose.yml` прибрані.
- Одна база auth. Порт 5433 і база `kinvue_auth` не використовуються.
- Термін refresh у коді: 7 днів. `REFRESH_TOKEN_TTL_DAYS=30` у `.env.example` — приклад із плану, код його не читає.
- `MEDIA_URL_TTL_SECONDS=600` теж лише приклад.

## Перевірка

2026-10-27. Другий проєкт Compose зупинений, його томи прибрані. Один файл піднято заново.

| Перевірка      | Результат                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| postgres       | `pg_isready` на базі `kinvue` приймає з'єднання, порт 5432. Том — уже наявний `kinvue_server_postgres_data` |
| movie-postgres | healthy, окремий том                                                                                        |
| users-mongo    | healthy                                                                                                     |
| rooms-redis    | healthy                                                                                                     |
| rabbitmq       | healthy                                                                                                     |
| meilisearch    | контейнер не стартував: порт 7700 зайнятий `nisha-meilisearch-1`                                            |
| minio          | healthy. Init завершився з кодом 0, бакет `kinvue-media` має доступ `private`                               |
| prometheus     | healthy                                                                                                     |
| grafana        | healthy                                                                                                     |
