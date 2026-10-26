## What to do

Create `infra/docker-compose.yml` with Auth PostgreSQL on port 5433 and Movie PostgreSQL on port 5434. These databases back auth-service and movie-service; local services cannot start without them.

## Technical notes

- File: `infra/docker-compose.yml`; start with `pnpm infra:up`
- Labels: infra, blocked-by-infra

## Story points

2

## Depends on

KIN-5

## Acceptance criteria

- `auth-postgres` service on port 5433
- `movie-postgres` service on port 5434
- Both accept connections after `pnpm infra:up`

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
