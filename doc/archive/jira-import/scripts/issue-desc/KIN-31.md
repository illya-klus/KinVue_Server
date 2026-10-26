## Goal

Deploy KinVue MVP to production within <= $300/month with smoke-tested Gateway, WS, and media.

## Scope

Production Dockerfiles, infra provisioning, deploy, migrations, deployment runbook.

## Out of scope

Do not target 100k concurrent users — MVP scale only.

## Suggested order

1. KIN-711: Production Dockerfiles + env documentation
2. KIN-712: Provision MVP infra (DBs, Redis, RabbitMQ, object storage, CDN) within <= $300/month budget
3. KIN-713: Deploy services + run migrations + smoke tests
4. KIN-714: Write `docs/runbooks/deployment.md`

## References

- 28_JIRA_BACKLOG.md
