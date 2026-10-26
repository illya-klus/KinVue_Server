## What to do

Add Auth PostgreSQL migrations in `apps/auth-service` for the `auth_identities` table with status constraint and unique email. Auth is the source of truth for login credentials and registration state.

## Technical notes

- Use service-local migration tooling; test against empty DB in CI
- Labels: backend, auth

## Story points

3

## Depends on

KIN-32, KIN-16

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
