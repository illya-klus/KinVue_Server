## What to do

Implement idempotent `POST /internal/users/profiles` in users-service — same `userId` returns 200 with existing profile. Called by Auth during registration Saga.

## Technical notes

- Service: `apps/users-service` port 4002; MongoDB `USERS_MONGO_URL` mongodb://localhost:27017/kinvue_users
- Labels: backend, users

## Story points

3

## Depends on

KIN-111

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
