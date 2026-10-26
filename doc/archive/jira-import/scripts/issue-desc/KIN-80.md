## What to do

Implement `POST /auth/logout` to revoke the current refresh session in PostgreSQL. Called through Gateway on authenticated routes.

## Technical notes

- Service: `apps/auth-service` port 4001; DB `AUTH_DATABASE_URL` postgresql://localhost:5433
- Labels: backend, auth

## Story points

2

## Depends on

KIN-124

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
