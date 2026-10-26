## What to do

Add a Dockerfile for each app under `apps/` and register all services in `infra/docker-compose.yml`. Enables running the full KinVue stack locally with one command.

## Technical notes

- File: `infra/docker-compose.yml`; start with `pnpm infra:up`
- Labels: infra

## Story points

3

## Depends on

KIN-31–KIN-37, KIN-16

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
