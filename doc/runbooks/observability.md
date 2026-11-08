# Observability (local)

## Endpoints

| Service          | Metrics                       |
| ---------------- | ----------------------------- |
| Gateway          | http://localhost:4000/metrics |
| Auth             | http://localhost:4001/metrics |
| Users            | http://localhost:4002/metrics |
| Movie            | http://localhost:4003/metrics |
| Rooms            | http://localhost:4004/metrics |
| Notification     | http://localhost:4005/metrics |
| Transcode worker | http://localhost:4016/metrics |

## Prometheus

- UI: http://localhost:9090
- Config: `infra/prometheus/prometheus.yml` (targets `host.docker.internal:4000`–`4016`)
- After `pnpm infra:up`, open **Status → Targets**; all KinVue jobs should be **UP** while apps run on the host.

## Grafana

- UI: http://localhost:3001 (admin/admin by default from `.env.example`)
- Datasource: auto-provisioned **Prometheus** → `http://prometheus:9090` (`infra/grafana/provisioning/datasources/prometheus.yml`)
- Dashboards: **KinVue Overview**, **KinVue Rooms**, **KinVue Media** (`infra/grafana/provisioning/dashboards/json/`)

## Key metrics

- `http_requests_total`, `http_request_duration_seconds` — all HTTP services (exclude `/health`, `/metrics`)
- `auth_login_attempts_total{outcome}` — Auth Google sign-in
- `auth_registration_attempts_total{outcome}` — when register path emits attempts
- `users_profile_reads_total`, `users_friendship_operations_total`, `users_search_latency_seconds` — Users (after API handlers increment)
- `movie_search_*`, `movie_reconcile_runs_total` — Movie search/reconcile
- `rooms_websocket_connections`, `rooms_redis_reachable` — Rooms
- `rabbitmq_queue_depth{queue}` — `notifications.events` + DLQ
- `media_transcode_jobs_total`, `media_transcode_duration_seconds`, `media_transcode_queue_depth` — worker

## Local workflow

1. `pnpm infra:up` (Prometheus + Grafana + data plane).
2. Run services on host ports 4000–4005, 4016 (see table above).
3. Prometheus **Targets** → all `kinvue-*` jobs UP.
4. Grafana → open each dashboard; panels use `service` / `outcome` labels from prom-client.

## Capacity note (MVP)

Local dashboards validate wiring, not 100k-user saturation. Record load-script output under `doc/runbooks/capacity-results.md`. Do not add horizontal search/cache tiers until an NFR is proven failed on measured p95.

## Log correlation

Pass `x-request-id` from Gateway through proxies; grep logs by that id across services. Never log refresh tokens, passwords, or signed media URLs.

Secrets (tokens, emails) must not appear in metric label values.
