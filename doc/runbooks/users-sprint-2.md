# Users: профілі, дружба й outbox

Публічний клієнт звертається до Gateway. Users приймає довірений `x-user-id` від Gateway, тому тримайте порт Users у приватній мережі або на loopback. `POST /internal/users/profiles` доступний лише напряму в Users і не має маршруту в Gateway. Це endpoint KIN-339: він повертає 201 після створення, 200 для того самого `userId` і 409, якщо username належить іншому користувачу. Виклик із саги Auth тут не підключено; погоджений контракт Auth → Users описано в рішеннях 0003 і 0024.

## Сховище та локальний запуск

У штатному `docker-compose.yml` сервіс `users-mongo` стартує як локальний replica set `kinvue-users` з одним вузлом. Використовуйте `USERS_MONGO_URL` із `.env.example` для запуску з хоста; у контейнерній мережі використовуйте DNS `users-mongo` замість `127.0.0.1`. Для розгорнутого Users потрібен MongoDB replica set або sharded cluster із підтримкою транзакцій. Readiness перевіряє готовність власної MongoDB; liveness не залежить від неї.

```sh
docker compose --env-file .env.example up -d --wait users-mongo rabbitmq
pnpm build:shared
pnpm --filter @kinvue/users build
pnpm --filter @kinvue/users db:indexes
pnpm --filter @kinvue/users start:prod
```

Задайте `USERS_MONGO_URL` та `RABBITMQ_URL` у середовищі команд Users. Скрипт `db:indexes` можна запускати повторно; перша операція Users з БД також перевіряє індекси. Профілі зберігаються в `users` (`_id` дорівнює `userId`), пара в `friendships` унікальна за `user1Id, user2Id`. Попередній прототип не підключав модулі в AppModule. Якщо прототип запускали вручну зі старими `profiles` або дружбами на `pairKey`, окремо перенесіть ці дані перед увімкненням нового коду; автоматичного переміщення чи видалення старих документів немає.

Пошук, вхідні/вихідні запити та друзі повертають `{ items, nextCursor }`. Передавайте отриманий `nextCursor` як `cursor` у тому самому списку або пошуку; `null` означає кінець. `limit` за замовчуванням 20, максимум 50. Пошук від двох символів.

## Доставка сповіщень

Створення запиту та його прийняття записують подію `PENDING` у `outbox_events` в одній MongoDB транзакції зі зміною дружби. Відхилення не створює події. Воркер публікує збережений `eventId` у `kinvue.domain` і ставить `PUBLISHED` тільки після підтвердження маршрутизованого повідомлення. Без RabbitMQ або потрібного binding запис лишається `PENDING`. Якщо брокер прийняв повідомлення, але Users не встиг позначити його опублікованим, можливий повтор із тим самим `eventId`; споживач має його дедуплікувати.

## Перевірка

Задайте `TEST_USERS_MONGO_URL` для тестового replica set і `TEST_USERS_RABBITMQ_URL` для окремого брокера, після чого запустіть:

```sh
pnpm --filter @kinvue/users test:e2e --runInBand
```

Тест створює й прибирає власну базу та тимчасову RabbitMQ чергу. Без цих змінних тест зі справжньою залежністю пропускається.
