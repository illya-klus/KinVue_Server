# Infrastructure and DevOps

## Local

Compose runs Auth PostgreSQL on 5433, Movie PostgreSQL on 5434, Users MongoDB on 27017, Redis on 6379, RabbitMQ on 5672 and 15672, Meilisearch on 7700, MinIO on 9000 and 9001, Prometheus on 9090, and Grafana on 3001. Application ports are 3000 and 4000-4005, plus Rooms WebSocket 4014.

Local Redis is one node. The runbook must say that this does not satisfy the production HA requirement. Local object storage is one bucket, `kinvue-media`, with key prefixes. That matches the decision to avoid extra buckets in v1.

`.env.example` is committed. `.env` is not.

## CI

GitHub Actions is the provider named by the implementation plan. The workflow installs Node 20 and pnpm, then runs format, lint, typecheck, unit tests, Compose integration tests, and the Playwright smoke. Failure artifacts are uploaded. Branch protection is a repository setting the operator turns on. Secret scanning and dependency scanning are included because the security phase requires them. The scanner product is not specified.

## MVP deployment

Do not introduce Kubernetes unless the hosting decision explicitly accepts it. The plan's target is a small VM or managed container platform plus managed data services where they fit the budget.

Provisioning tickets cover Auth database, Movie database, MongoDB, HA-capable Redis, AMQP, a private bucket, and a CDN. Gateway is HTTPS. Rooms is WSS. Other services stay on a private network. Secrets come from the platform secret manager.

A cost worksheet is a blocker. If the estimate exceeds $300 per month, provisioning stops.

## Operations

The pack does not define backup frequency or a rollback runbook. Those are gap G-13. The operations ticket asks the operator to set a backup owner and frequency, or to leave the unknown explicit. Stateless services roll back by image. Schema changes are forward-only unless a specific down migration is written. Multi-region recovery stays deferred.

## Production readiness checks

Health endpoints, request ids, three dashboards, a security runbook, a deployment runbook, and a deployed smoke of login, WebSocket handshake, and one signed playlist.
