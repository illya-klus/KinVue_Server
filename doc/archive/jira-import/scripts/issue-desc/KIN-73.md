## What to do

Create the MongoDB `friendships` collection with canonical pair normalization (`user1Id` < `user2Id`). Prevents duplicate friend relationships in either direction.

## Technical notes

- Service: `apps/users-service` port 4002; MongoDB `USERS_MONGO_URL` mongodb://localhost:27017/kinvue_users
- Labels: backend, users

## Story points

3

## Depends on

KIN-111

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
