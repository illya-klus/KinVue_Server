## What to do

Add the `refresh_sessions` table with indexes on `user_id` and `expires_at` in auth-service. Supports refresh-token rotation (30-day TTL) used by login and logout.

## Technical notes

- Labels: backend, auth

## Story points

2

## Depends on

KIN-101

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
