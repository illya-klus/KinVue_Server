# 0002. Публічний край — HTTP gateway

- Статус: прийнято
- Дата: 2026-10-26
- Джерело: стан репозиторію
- Замінено: частково, [0008](0008-target-ingress-and-plan.md)

## Контекст

Зараз у коді клієнтський HTTP входить у gateway. Цільовий план має ще два зовнішні шляхи: WebSocket у Rooms і медіа через CDN. Вони описані в 0008 і не є порушенням цього запису.

## Рішення

Публічний HTTP — лише `@kinvue/gateway`.

- Глобальний префікс `api`. Порт з змінної `PORT`.
- `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- CORS зі списку `ORIGINS` з credentials. Helmet увімкнений.
- Swagger підключений з `services/gateway/src/config/swagger`.
- Request id і логер запитів висять на всіх маршрутах.

`@kinvue/auth` HTTP не слухає. Каркаси `user`, `room`, `movie`, `chat`, `notification` досі викликають `listen`, бо це недоторканий шаблон Nest. Цей `listen` не є дозволом віддавати їм публічний API.

## Порушення

Новий клієнтський HTTP API в обхід gateway. Зняття префікса `api` або валідації DTO на цьому HTTP-краї. Розростання шаблонного `listen` у продуктовий API.

Окремий WebSocket-вхід Rooms і роздача відео через CDN цьому запису не суперечать.

## Наслідки

Новий клієнтський HTTP-маршрут додають у gateway. Внутрішній виклик auth лишається gRPC, доки окремий тікет не змінить транспорт.
