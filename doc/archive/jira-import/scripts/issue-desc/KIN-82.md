## What to do

Create `packages/config` with Zod-validated environment loading — one schema per service so missing vars fail fast at startup. Every KinVue microservice imports this package instead of reading `process.env` directly.

## Technical notes

- Package: `packages/config`; use Zod schemas per service
- Labels: backend

## Story points

3

## Depends on

KIN-5

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
