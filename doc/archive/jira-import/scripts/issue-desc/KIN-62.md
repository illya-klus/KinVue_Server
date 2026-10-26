## What to do

Scaffold `apps/movie-service` on port 4003 with health, readiness, and metrics. Movie owns catalog metadata, watchlist, search indexing, and media keys in PostgreSQL.

## Technical notes

- Service: `apps/movie-service` port 4003; DB postgresql://localhost:5434; Meilisearch http://localhost:7700
- Labels: backend, movies

## Story points

2

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
