# Rooms realtime — Sprint 4

Джерело: KIN-150/153/186/187/189/193/197/202/207/212/230/235/255/257; прийняті 0022/0026.

## Запуск і контракт

Node 24, pnpm 10.34.4. Виконайте `pnpm build:shared`, `pnpm --filter @kinvue/rooms build`, `pnpm --filter @kinvue/rooms start:prod` із налаштованим оточенням Rooms: ROOMS_DATABASE_URL, REDIS_URL, AUTH_SERVICE_URL, JWT_ISSUER, JWT_AUDIENCE. HTTP — 4004, WS — 4014. Наявні HTTP/invite/schedule компоненти використовують власну PostgreSQL; realtime — Redis.

HTTP клієнта йде через NEXT_PUBLIC_GATEWAY_URL (localhost:4000); WS окремо через NEXT_PUBLIC_ROOMS_WS_URL (ws://localhost:4014/rooms). У production використовуйте WSS. Apps-профіль Compose використовує Auth на хості; ROOMS_AUTH_SERVICE_URL/GATEWAY_AUTH_SERVICE_URL перевизначають host.docker.internal:4001 на приватну адресу Auth.

Підключення: `/rooms?roomId=<uuid>&token=<access JWT>`. Rooms перевіряє RS256, issuer/audience, exp/iat/sub та UUID через кешований JWKS. Поганий JWT не проходить upgrade (401). Невідома/закрита/повна кімната або приватна без доступу закриває socket із 1008. Токен із query не логують. JWT/Auth не перевіряється мережевим викликом на кожну команду.

PUBLIC приймає автентифікованих користувачів до 20 активних membership. PRIVATE приймає власника, поточного учасника або адресата чинного direct invite. Token invite спочатку приймається через наявний HTTP API. LEFT звільняє місце та не дає сам собою повторного доступу до приватної кімнати.

Перший frame — room.state_sync з roomId, userId, role, movieId, playbackStatus, positionSeconds, updatedAt (ISO), version. Підписка буферизує поточні події до snapshot; старі playback versions відкидаються. Історія Pub/Sub не відтворюється.

| type                               | Поля                                           | Умова                                              |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| room.play / room.pause / room.seek | roomId, eventId, positionSeconds, clientSentAt | OWNER/CONTROLLER; finite nonnegative position      |
| room.heartbeat                     | roomId                                         | Клієнт кожні 30 s                                  |
| room.leave                         | roomId                                         | LEFT, закриття socket, подальші команди заборонені |
| chat.message                       | roomId, messageId, text                        | Trim, 1–1000 символів                              |
| chat.reaction                      | roomId, reactionId, emoji                      | like/laugh/wow/sad/fire                            |

Автор береться з перевіреного socket. RoomId, membership і актуальна роль перевіряються для кожної мутації. Неприпустимий frame дає безпечний room.error. Owner HTTP зміна ролі розсилає room.role_changed; закриття — room.closed.

Play відновлює серверний anchor. Pause обчислює anchor + час, якщо був PLAYING. Seek задає нову позицію. Один Lua-запит перевіряє права, змінює стан і version та робить PUBLISH після запису. Останній оброблений стан перемагає; clientSentAt не задає глобальний порядок.

## Redis, presence і web

Збережено наявний HTTP ключ room:<id>, membership room:<id>:members. Chat: :messages, dedup: :message-ids, канал: room:<id>:events. Підписка є лише для кімнат із локальними sockets; останній disconnect прибирає її.

Неактивність — 6 h, close — 15 min; messages/dedup TTL узгоджений із room. Текст старший 24 h прибирається при append. Dedup за (автор,messageId) не створює другого запису чи broadcast. Реакції не зберігаються в таблиці або chat list.

Sweep кожні 15 s позначає ONLINE як DISCONNECTED, лише коли heartbeat старший 75 s. Heartbeat відновлює ONLINE; LEFT потребує нового join. Presence і role зміни йдуть через room Pub/Sub.

Клієнт автоматично перепідключається й відновлює access через cookie. До state_sync керування заблоковане; VIEWER не керує. Старі versions і дублікати chat відкидаються. Native media controls у room вимкнені, HlsPlayer застосовує authoritative anchor; solo player не надсилає room events. Числовий бюджет drift не вводився.

## Перевірки

- `pnpm --filter @kinvue/rooms test --runInBand`
- `pnpm --filter @kinvue/rooms test:realtime` — disposable Redis 7 на 56379 (ROOMS_TEST_REDIS_PORT), два інстанси, справжні RS256/JWKS.
- `pnpm typecheck`, `pnpm format:check`.
- Client: `pnpm test:e2e`.

`node services/room/test/browser-realtime.smoke.cjs` потребує Client на 3000 і Playwright Chromium поруч. Займає тестові 4000/4014/4015/56380; створює і прибирає власний Redis. HTTP Auth/metadata — fixture; WS/JWT/Redis/PubSub — справжні. Перевіряє браузер ↔ другий інстанс, restart/resync і leave. Використовуйте лише в ізольованому локальному оточенні.

Доставка HLS/S3/FFmpeg/CDN лишається наступною роботою. Цей спринт перевіряє room control plane. [Звіт](../verification/2026-11-22-sprint-4.md).
