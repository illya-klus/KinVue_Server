## What to do

Scaffold `apps/rooms-service` with HTTP on port 4004 and a WebSocket listener placeholder on port 4014. Rooms owns ephemeral watch-together state in Redis.

## Technical notes

- Service: `apps/rooms-service` HTTP 4004, WS ws://localhost:4014/rooms; Redis `redis://localhost:6379`
- Labels: backend, rooms

## Story points

3

## Depends on

KIN-22–KIN-26

## Acceptance criteria

- Meets Definition of Done for KinVue stories (tests pass, PR reviewed, no secrets committed)

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md
