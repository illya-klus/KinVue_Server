# Production deploy (Phase 32)

KIN-278, KIN-308, KIN-311, KIN-320, KIN-323.

## Docker images (KIN-278)

| Image | Dockerfile | USER | HEALTHCHECK |
|-------|------------|------|-------------|
| gateway | `docker/gateway/Dockerfile` | node | `/health/live` |
| auth | `docker/auth/Dockerfile` | node | yes |
| users | `docker/users/Dockerfile` | node | yes |
| movie | `docker/movie/Dockerfile` | node | yes |
| rooms | `docker/rooms/Dockerfile` | node | yes |
| notification | `docker/notification/Dockerfile` | node | yes |
| transcode-worker | `docker/transcode-worker/Dockerfile` | node + ffmpeg | yes |

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
