# Sprint 6: живе приймання

Джерело: стан репозиторіїв і Jira 2026-11-25. Обсяг Анатолія: KIN-129/182/205/229/253/254/256/258/259/261/288/292/293/294.

## Залежності та межі

Server гілка створена від dev і містить залежність Sprint 5 PR #67. Client гілка створена від main і містить Client PR #16. Ці залежності не зливаються автоматично. CI парної Client гілки `codex/sprint-6-prove` перевіряє однойменну Server гілку; після злиття у main звичайний CI знову перевіряє dev.

Файл `e2e/sprint-6.live.spec.ts` у Client не підміняє Gateway/Auth/Users/Movie/Rooms. Дії продукту йдуть через Gateway на 4000, публічний WS 4014 і підписані S3 URL 9000. Налаштування admin та teardown використовують внутрішні БД тільки як fixture maintenance. Cleanup дозволений лише з `E2E_DISPOSABLE_STACK=1`, перевіряє UUID і видаляє власних користувачів, дружбу, фільми, watchlist, outbox та об'єкти сховища. Тестові кімнати закриваються через Gateway. CI знищує тільки свій disposable stack.

## Сценарій браузера

1. Реєстрація двох справжніх акаунтів і парольний вхід. Admin надається наявним Auth CLI; потім повторний вхід отримує свіжі scopes.
2. Display name/preferences зберігаються після reload. Короткий пошук не надсилається; інший користувач знаходиться, приймає запит і дружба видима обом.
3. Admin створює дві чернетки. Відео-фікстура генерується FFmpeg лише у worker-контейнері, має понад 8 MiB та завантажується двома або більше частинами. Одну частину навмисно перервано; завершені частини не повторюються.
4. Справжні S3 completion, DB outbox, RabbitMQ, FFmpeg worker і callback доводять стан до READY. Вирівняно драбину рішення 0026: 5/3/1.5 Mbps; encoder/filter threads обмежені для CI. stderr воркера читається, щоб тривалий процес не блокувався на pipe.
5. Admin публікує фільм; пошук знаходить опубліковану назву, але не чернетку. Chromium декодує HLS, currentTime зростає, сегменти йдуть напряму в приватне сховище з підписом. Watchlist add/remove перевірено через UI.
6. Два браузери приєднуються до кімнати, ролі застосовуються. Play/pause/seek, chat та reactions перевіряються в обидва боки.
7. Pub/Sub connection kill змушує sockets отримати 1012 і перепідключитися; новий socket спочатку отримує state_sync. Restart контейнера Rooms зберігає позицію/version і відновлює обох клієнтів.

## Redis fault regression на сервері

`pnpm --filter @kinvue/rooms test:realtime` додатково перериває всі Pub/Sub connections власної Redis fixture, змінює authoritative стан і публікує chat під час розриву. Після реконекту перевіряються новий snapshot і відсутність replay, а також нові live commands. Окремо listener зупиняється і запускається на тому самому порту.

Subscriber має bounded retry interval, `autoResubscribe=false` та вимкнену offline queue. Після close локальні subscriptions скидаються і clients закриваються для resync. Нове приєднання під час недоступного Redis/subscriber має retriable 1013 замість незворотного access-denied 1008. Membership denial зберігає 1008. Стан і буфер перевіряються тим самим snapshot barrier зі Sprint 4.

## Запуск

У Client CI до наявного disposable full stack додаються MinIO/init і transcode-worker. Згенерований файл лежить у `.e2e-fixtures/` і не комітиться. `E2E_SPRINT6=1` вмикає live suite; без прапорця він пропускається і не зараховується як доказ.

Потрібні `E2E_BACKEND_DIR`, `E2E_MEDIA_FIXTURE`, `E2E_AUTH_DATABASE_URL`, `E2E_MOVIE_DATABASE_URL`, `E2E_USERS_MONGO_URL`, `E2E_MEILI_URL/KEY`, `E2E_S3_URL/ACCESS_KEY/SECRET_KEY`; значення мають належати ізольованому стенду. Команда: `pnpm exec playwright test e2e/sprint-6.live.spec.ts --workers=1`.

Фактичний результат приймання береться з CI відповідного PR/SHA. Написаний або пропущений тест не означає успішне приймання. На локальному C недостатньо місця для повного Docker-стенда; користувацькі дані й контейнери не чистяться.
