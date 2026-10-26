## What to do

Start the full Docker Compose stack with `pnpm infra:up` and verify every container is healthy — RabbitMQ UI, MinIO console, Meilisearch `/health`, and both PostgreSQL instances. Block downstream service work until infra is green.

## Technical notes

- Labels: infra, testing

## Story points

1

## Depends on

KIN-13, KIN-14, KIN-15

## Acceptance criteria

- `docker compose ps` shows all healthy
- RabbitMQ UI, MinIO console, Meilisearch health verified manually

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
