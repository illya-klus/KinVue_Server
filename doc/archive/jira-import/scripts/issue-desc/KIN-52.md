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

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
