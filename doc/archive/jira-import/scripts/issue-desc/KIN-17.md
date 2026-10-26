## Goal

Room lifecycle over HTTP: create, list public, invite, permissions, close — backed by Redis.

## Scope

Redis schemas, `POST/GET /rooms*` endpoints, `ROOM_INVITED` outbox, HTTP tests.

## Out of scope

Do not implement WebSocket, playback sync, or room UI in this epic.

## Suggested order

1. KIN-401: Redis key helpers and room state/member schemas
2. KIN-402: `POST /rooms` (private/public, capacity 20, 6h TTL)
3. KIN-403: `GET /rooms/public`
4. KIN-404: `POST /rooms/:id/invites` (owner only, default VIEWER) + `ROOM_INVITED` outbox event
5. KIN-405: `POST /rooms/:id/permissions` (owner grants CONTROLLER)
6. KIN-406: `POST /rooms/:id/close` (owner only, 15 min cleanup TTL)
7. KIN-407: Tests: create, invite authz, permission changes, close, TTL, capacity

## References

- 28_JIRA_BACKLOG.md
