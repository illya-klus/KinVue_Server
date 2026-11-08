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
- Provisioned dashboards: **KinVue Overview**, **KinVue Rooms**, **KinVue Media** (`infra/grafana/provisioning/dashboards/json/`)

## Key metrics

- `http_requests_total`, `http_request_duration_seconds` — all HTTP services
- `auth_login_attempts_total` — Auth gRPC login
- `users_*` — reserved counters for Users API
- `movie_search_*`, `movie_reconcile_runs_total` — Movie search/reconcile
- `rooms_websocket_connections`, `rooms_redis_reachable` — Rooms
- `rabbitmq_queue_depth` — Notification queues + DLQ
- `media_transcode_*` — Transcode worker

Secrets (tokens, emails) must not appear in label values.
