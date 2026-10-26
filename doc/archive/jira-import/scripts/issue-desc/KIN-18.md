## Goal

WebSocket ingress for watch rooms with JWT auth, access checks, state sync, and presence heartbeat.

## Scope

`ws://localhost:4014/rooms` handshake, `room.state_sync`, heartbeat/presence, WS tests.

## Out of scope

Do not implement playback commands, chat, or web room page in this epic.

## Suggested order

1. KIN-411: WebSocket endpoint `ws://localhost:4014/rooms` with JWT handshake
2. KIN-412: Room access checks (public/private, closed, capacity, invite list)
3. KIN-413: Send `room.state_sync` on connect
4. KIN-414: Heartbeat every 30s, stale after 75s, presence ONLINE/DISCONNECTED/LEFT
5. KIN-415: Tests: valid handshake, invalid JWT, private access denial, reconnect sync

## References

- 28_JIRA_BACKLOG.md
