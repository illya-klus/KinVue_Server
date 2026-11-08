# MVP data plane provision (KIN-297, KIN-299)

Operator checklist after `mvp-cost-estimate.md` is under $300.

## Redis (HA-capable)

- [ ] Provision managed Redis or redundant pair (not public).
- [ ] Store connection URL in secret manager (`REDIS_URL`).
- [ ] Record monthly cost in cost estimate table.
- [ ] Document resource id in deploy log (not in git).

## RabbitMQ / AMQP

- [ ] Provision managed AMQP or hardened self-hosted broker.
- [ ] Create vhost/user for KinVue; no guest on public internet.
- [ ] `AMQP_URL` in secret manager.
- [ ] Cost line updated.

## Verification

- Notification topology exchange/queue from app startup.
- Transcode queue `media.transcode` reachable from worker.

Local dev continues to use `pnpm infra:up` (compose).
