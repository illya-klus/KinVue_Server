# Локальний стек даних

Це інструкція до `infra/docker-compose.yml`. Сервіси Nest у цьому файлі не запускаються. Файл піднімає лише сховища, брокер, пошук і панель метрик, щоб їх можна було подивитись окремо від коду.

Код auth досі ходить у Postgres з кореневого `docker-compose.yml`: база `kinvue`, порт **5432**. Це [0006](../decisions/0006-postgres-16.md). Новий файл його не замінює і `DATABASE_URL` auth не перемикає.

Порти нижче — локальний приклад із тікетів KIN-171…KIN-214. Окремого рішення «карта портів прийнята» немає, [0010](../decisions/0010-v1-stack-backend-repo.md).

Паролі в цей файл не копіюй. Локальний приклад змінних лежить у `.env.example`. Свій `.env` у git не потрапляє.

## Як це складено

Усі контейнери в одному проєкті Compose `kinvue`. Між собою вони бачать імена сервісів у мережі `kinvue-data`. Ця мережа внутрішня: з неї немає виходу в інтернет. Мережа `kinvue-edge` лише публікує порти на `localhost`, щоб ти міг відкрити їх із машини.

Код сервісів до цих контейнерів ще не підключений. Зараз це стенд: підняв, перевірив, що процес живий, вимкнув.

| Контейнер               | Порт на машині         | Для чого в KinVue                                                                                                                                                                                           |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kinvue-auth-postgres`  | 5433                   | Майбутня база auth, окремо від фільмів. Зараз auth її не використовує.                                                                                                                                      |
| `kinvue-movie-postgres` | 5434                   | Майбутній каталог фільмів. Окремий том, не спільний з auth.                                                                                                                                                 |
| `kinvue-users-mongo`    | 27017                  | Майбутні профілі. База в URL: `kinvue_users`. Локально без логіна.                                                                                                                                          |
| `kinvue-rooms-redis`    | 6379                   | Живий стан кімнати: хто в ефірі, таймер. Один вузол. Це не кластер і не запасний Redis для продакшену.                                                                                                      |
| `kinvue-rabbitmq`       | 5672, панель 15672     | Черги між сервісами. Логін береться зі змінних, не зашитий у образ.                                                                                                                                         |
| `kinvue-meilisearch`    | 7700                   | Пошук фільмів. Один вузол. Ключ лише зі змінної.                                                                                                                                                            |
| `kinvue-minio`          | API 9000, консоль 9001 | Файли медіа. Один бакет `kinvue-media`, не відкритий на читання всім. Образ — `pgsty/minio`, бо `minio/minio` з Docker Hub зняли, а `quay.io/minio` без логіна не віддається. Команда і health URL ті самі. |
| `kinvue-prometheus`     | 9090                   | Збір метрик. Конфіг порожній: `scrape_configs: []`, файл валідний.                                                                                                                                          |
| `kinvue-grafana`        | 3001                   | Графіки. Всередині контейнера порт 3000, назовні навмисно 3001, щоб не зайняти типовий порт застосунку.                                                                                                     |

`kinvue-minio-init` — одноразовий контейнер. Він чекає, поки MinIO здоровий, створює бакет і знімає публічне читання. Після успіху він зупиняється. Це нормально.

## Команди

З кореня репозиторію:

```powershell
pnpm infra:up
pnpm infra:logs
pnpm infra:down
```

`infra:up` читає `.env.example`. Щоб підставити свої значення, скопіюй його в `.env` і запускай ту саму команду з `--env-file .env` замість `.env.example`.

Старий Postgres auth, якщо він потрібен коду:

```powershell
docker compose up -d
```

Це кореневий файл, порт 5432. `pnpm infra:down` його не чіпає.

## Куди дивитись

- Postgres: `docker exec kinvue-auth-postgres pg_isready -U kinvue_auth -d kinvue_auth` і те саме для `kinvue-movie-postgres` з користувачем і базою `kinvue_movie`.
- Mongo: `docker exec kinvue-users-mongo mongosh --quiet --eval "db.getSiblingDB('kinvue_users').runCommand({ ping: 1 })"`.
- Redis: `docker exec kinvue-rooms-redis redis-cli ping` має відповісти `PONG`.
- RabbitMQ: `http://localhost:15672`. Логін і пароль — `RABBITMQ_USER` і `RABBITMQ_PASSWORD` з env-файлу.
- Meilisearch: `http://localhost:7700/health`.
- MinIO: API `http://localhost:9000`, консоль `http://localhost:9001`. Бакет `kinvue-media` не має політики public-read.
- Prometheus: `http://localhost:9090`. Сторінка Targets буде порожня, бо збирати ще ні з кого.
- Grafana: `http://localhost:3001`. Логін — `GRAFANA_ADMIN_USER` і `GRAFANA_ADMIN_PASSWORD` з env-файлу.

Стан усіх контейнерів: `docker compose --env-file .env.example -f infra/docker-compose.yml ps`.

## Що навмисно не змінювалось

- Кореневий `docker-compose.yml` і база auth на 5432.
- Термін refresh у коді: 7 днів. `REFRESH_TOKEN_TTL_DAYS=30` у `.env.example` — приклад із плану, код його не читає.
- `MEDIA_URL_TTL_SECONDS=600` теж лише приклад. Коду, який підписує URL медіа, ще немає.
- Жоден Nest-сервіс не отримав новий `DATABASE_URL`.

## Перевірка підняття

2026-10-26. Docker Desktop спочатку не слухав пайп, його довелось запустити. Далі `docker compose config` пройшов, стек піднявся.

| Перевірка      | Результат                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth-postgres  | healthy, `pg_isready` приймає з'єднання                                                                                                                                                                                                                          |
| movie-postgres | healthy, окремий контейнер і том                                                                                                                                                                                                                                 |
| users-mongo    | healthy, ping бази `kinvue_users` повернув `ok: 1`                                                                                                                                                                                                               |
| rooms-redis    | healthy, `PING` → `PONG`                                                                                                                                                                                                                                         |
| rabbitmq       | healthy, діагностика ping успішна, `http://localhost:15672` відповів 200                                                                                                                                                                                         |
| meilisearch    | образ відповідає `{"status":"available"}` на `/health`. Контейнер стенда не стартував: порт 7700 уже зайнятий `nisha-meilisearch-1`. Пробний контейнер на 7701 після перевірки видалений. Щоб підняти KinVue-пошук, звільни 7700 і знову виконай `pnpm infra:up` |
| minio          | healthy, `http://localhost:9000/minio/health/live` відповів 200. Init завершився з кодом 0: бакет `kinvue-media` створений, доступ `private`                                                                                                                     |
| prometheus     | healthy, `http://localhost:9090/-/healthy` відповів 200. Активних targets немає                                                                                                                                                                                  |
| grafana        | healthy, `http://localhost:3001/api/health` відповів 200, база `ok`                                                                                                                                                                                              |

`kinvue-minio-init` після успіху зупинився. Так і задумано.
