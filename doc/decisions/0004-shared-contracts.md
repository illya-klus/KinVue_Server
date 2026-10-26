# 0004. Спільні контракти в `@kinvue/contracts`

- Статус: прийнято
- Дата: 2026-10-26
- Джерело: стан репозиторію
- Замінено: немає

## Контекст

Gateway і auth мають бачити одні й ті самі типи RPC.

## Рішення

- Джерело контрактів: `packages/shared-protos/proto`.
- Пакет: `@kinvue/contracts`.
- Типи генерує скрипт `generate` цього пакета (`grpc-tools`, `ts-proto`, опції `nestJs` і `outputServices=grpc-js`).
- Перевірка з кореня: `pnpm typecheck:contracts` (спочатку збірка контрактів, потім typecheck).

Згенеровані файли в `src/generated` не правлять руками.

## Порушення

Ручна правка `src/generated`. Зміна proto без генерації. Друга копія proto в сервісі.

## Наслідки

Зміна RPC починається з `.proto`, далі генерація, далі код gateway і сервісу.
