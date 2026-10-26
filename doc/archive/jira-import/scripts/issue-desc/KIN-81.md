## What to do

Implement the registration Saga in `POST /auth/register`: generate `userId`, write Auth identity (`PENDING` → `PROFILE_CREATING` → `ACTIVE`), call users-service `POST /internal/users/profiles` idempotently, retry 3× on failure, compensate with 503. This is the most critical cross-service flow in KinVue.

## Technical notes

- Service: `apps/auth-service` port 4001; DB `AUTH_DATABASE_URL` postgresql://localhost:5433
- Labels: backend, auth

## Story points

5

## Depends on

KIN-101, KIN-111

## Acceptance criteria

- Generates global userId before DB write
- Status flow: PENDING → PROFILE_CREATING → ACTIVE
- Calls POST /internal/users/profiles idempotently
- Returns 201 only when Auth + Users both exist
- Retries Users 3x, then compensates with 503
- Duplicate email returns 409

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
