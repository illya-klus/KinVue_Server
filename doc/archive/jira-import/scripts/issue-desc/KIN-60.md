## What to do

Scaffold `apps/auth-service` on port 4001 with health, readiness, and Prometheus metrics endpoints. Auth owns identity, credentials, refresh sessions, and JWKS.

## Technical notes

- Service: `apps/auth-service` port 4001; DB `AUTH_DATABASE_URL` postgresql://localhost:5433
- Labels: backend, auth

## Story points

2

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
