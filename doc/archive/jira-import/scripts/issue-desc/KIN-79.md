## What to do

Implement `POST /auth/refresh` with refresh-token rotation: revoke old session, issue new pair. Prevents refresh-token reuse attacks.

## Technical notes

- Service: `apps/auth-service` port 4001; DB `AUTH_DATABASE_URL` postgresql://localhost:5433
- Labels: backend, auth

## Story points

3

## Depends on

KIN-123

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
