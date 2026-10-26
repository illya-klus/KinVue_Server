## What to do

Implement `GET /users/me` and `PATCH /users/me` in users-service. Gateway forwards these with `x-user-id` header after JWT validation.

## Technical notes

- Service: `apps/users-service` port 4002; MongoDB `USERS_MONGO_URL` mongodb://localhost:27017/kinvue_users
- Labels: backend, users

## Story points

3

## Depends on

KIN-131

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
