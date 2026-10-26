## What to do

Emit `FRIEND_REQUEST_CREATED` and `FRIEND_REQUEST_ACCEPTED` events to MongoDB `outbox_events` after friendship actions. Notifications-service consumes these via RabbitMQ.

## Technical notes

- Service: `apps/users-service` port 4002; MongoDB `USERS_MONGO_URL` mongodb://localhost:27017/kinvue_users
- Labels: backend, users, notifications

## Story points

3

## Depends on

KIN-134

## Acceptance criteria

- See Definition of Done in 28_JIRA_BACKLOG.md

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
