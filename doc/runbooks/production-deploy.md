# Production deploy (Phase 32)

KIN-278, KIN-308, KIN-311, KIN-320, KIN-323.

## Docker images (KIN-278)

| Image            | Dockerfile                           | USER          | HEALTHCHECK    |
| ---------------- | ------------------------------------ | ------------- | -------------- |
| gateway          | `docker/gateway/Dockerfile`          | node          | `/health/live` |
| auth             | `docker/auth/Dockerfile`             | node          | yes            |
| users            | `docker/users/Dockerfile`            | node          | yes            |
| movie            | `docker/movie/Dockerfile`            | node          | yes            |
| rooms            | `docker/rooms/Dockerfile`            | node          | yes            |
| notification     | `docker/notification/Dockerfile`     | node          | yes            |
| transcode-worker | `docker/transcode-worker/Dockerfile` | node + ffmpeg | yes            |

Secrets: inject at runtime via env / secret manager — never bake `.env` into images.

## Environment contract

See `.env.example` and `local-dev.md` for port map. Production adds:

- `GATEWAY_PUBLIC_URL` (HTTPS)
- `ROOMS_WS_PUBLIC_URL` (WSS)
- `WEB_APP_ORIGIN` (CORS allowlist)
- All `*_DATABASE_URL`, `USERS_MONGO_URL`, `REDIS_URL`, `AMQP_URL`, `MEILI_*`, `S3_*`, `JWT_*`

## Topology (KIN-308)

- Public: Gateway (HTTPS), Rooms WebSocket (WSS), static web (KinVue_Client host).
- Private network: Auth, Users, Movie, Notifications, transcode-worker.
- Video bytes: signed URLs to object storage/CDN — **not** proxied through Gateway.

## TLS termination and browser origins (KIN-203)

- Terminate public TLS at the managed ingress or reverse proxy in front of Gateway and Rooms. Use a valid certificate with automated renewal, redirect public HTTP to HTTPS, and expose Gateway as HTTPS and the Rooms WebSocket as WSS. The ingress must pass WebSocket upgrade headers to Rooms.
- Keep application ports private behind the ingress. Configure `ORIGINS` on Gateway as the comma-separated exact browser origins, including scheme and port when non-default. For example, local development uses `http://localhost:3000,http://localhost:5173`; production uses the deployed web origin with `https://`. Do not use `*` with credentialed requests.
- Localhost development may use plain HTTP and WS. Do not require certificates for localhost. Production browser cookies are marked Secure when `NODE_ENV=production`; TLS must cover the public request path before traffic reaches the services.
- Gateway returns 403 for a request carrying an Origin that is not in `ORIGINS`. Requests without an Origin (for example, server-to-server calls) are not rejected by the CORS origin guard.

## Migrations and search (KIN-311)

1. Auth migrations (forward only).
2. Movie migrations.
3. Notifications migrations.
4. `pnpm --filter @kinvue/movie search:rebuild` or reconcile until Meilisearch matches PostgreSQL published set.

Fail release if any step errors.

## Production smoke (KIN-320)

Log in via Gateway → open Rooms WSS handshake → `POST …/media-access` returns playlist URL. No service streams raw video bytes.

## Rollback and backups (KIN-323)

- Stateless apps: redeploy previous image tag.
- DB: forward migrations only unless a documented down migration exists (none in MVP).
- Backups: operator sets frequency — Auth PG, Movie PG, Users Mongo, media bucket (G-13 TBD frequencies).

Multi-region DR is **out of scope** for MVP.
