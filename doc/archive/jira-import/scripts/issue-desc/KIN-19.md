## Goal

Synchronize play/pause/seek across room participants via Redis state and Pub/Sub fan-out.

## Scope

Playback events, Redis sync point, cross-instance Pub/Sub, multi-instance and reconnect tests.

## Out of scope

Do not build chat, reactions, or HLS player UI in this epic.

## Suggested order

1. KIN-421: Handle `room.play`, `room.pause`, `room.seek` with permission checks
2. KIN-422: Store sync point in Redis (`status`, `position`, `updatedAt`, `version`)
3. KIN-423: Redis Pub/Sub fan-out across Rooms instances (subscribe only active rooms)
4. KIN-424: Broadcast `room.playback_state_changed` with monotonic version
5. KIN-425: Multi-instance test: user A pauses on instance 1, user B receives on instance 2
6. KIN-426: Reconnect test: client receives authoritative Redis state without Pub/Sub replay

## References

- 28_JIRA_BACKLOG.md
