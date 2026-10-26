## Goal

Complete watch-room UI: create/join rooms, HLS player synced to playback state, chat, reactions, reconnect.

## Scope

Room creation from movie detail, public list, invites, player, chat panel, 2-browser E2E test.

## Out of scope

Do not implement notifications bell or admin upload in this epic.

## Suggested order

1. KIN-441: Create room UI from movie detail (solo/private/public)
2. KIN-442: Public rooms list + join flow
3. KIN-443: Invite friend UI + copy invite URL
4. KIN-444: Participants list + owner permission controls
5. KIN-445: HLS player integrated with room playback state (owner/controller vs viewer)
6. KIN-446: Chat panel + reaction buttons in room page
7. KIN-447: Reconnect banner + wait for `room.state_sync` before local controls
8. KIN-448: E2E: 2-browser play/pause/seek/chat/reaction/reconnect test

## References

- 28_JIRA_BACKLOG.md
