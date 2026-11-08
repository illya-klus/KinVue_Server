# Failure and recovery (Phase 30)

Operator notes for local reproduction. Automated coverage lives in unit tests where noted.

## Gateway restart (KIN-167, Step 30.1–30.2)

Gateway is stateless: JWT validation uses Auth JWKS; no session store in Gateway memory.

1. `pnpm dev:gateway` and hit `GET /health/live`.
2. Stop the process, start again.
3. Repeat an authenticated `GET /api/users/me` with the same Bearer token — must succeed if Auth is up and token not expired.

**Automated:** `services/gateway` proxy and JWT specs; no durable business state in Gateway process.

## Redis restart — room ephemeral state (KIN-184, Step 30.11–30.12)

1. `pnpm infra:up`, open a room via Rooms WS.
2. `docker compose restart rooms-redis`.
3. Expect active room keys may disappear; clients must reconnect and receive `room.state_sync`.

**Production:** Redis must be HA (see `mvp-data-plane-provision.md`). Local single-node loss is accepted for dev.

## Meilisearch down during publish (KIN-211, Step 30.15–30.16)

1. Publish a movie while Meilisearch container is stopped.
2. PostgreSQL `PUBLISHED` row must remain; search may fail until reconciliation (`movie-reconcile` cron) or manual `search:rebuild`.

**Automated:** `MovieReconcileService` and search tests in `@kinvue/movie`.

## RabbitMQ down — outbox pending (KIN-216, Step 30.17–30.18)

When Users/Movie outbox publishers cannot reach AMQP, rows stay `pending`. After broker returns, publisher retries.

Documented pattern; wire in Users outbox when epic lands.

## Notification consumer crash before ACK (KIN-220, Step 30.19–30.22)

Manual ACK only after DB write or dedup hit. Crash before ACK ⇒ redelivery; duplicate `eventId` must not create a second row.

**Automated:** `notifications.repository.spec.ts`, `consumer.service.spec.ts`, `KIN-301` reliability tests.

## Transcode worker crash (KIN-224, Step 30.23–30.24)

Job remains in queue until ACK; worker retry up to 3 attempts, then `transcode-failed` internal callback.

**Automated:** transcode-worker fixture HLS test; full crash loop requires compose + RabbitMQ in a future integration job.

## Multipart upload interrupted (Step 30.25–30.26)

Client retries failed parts only (`KinVue_Client` upload UI). Abandoned uploads: cleanup job per plan (24h).

See Phase 22 upload runbook when Movie admin API is complete.
