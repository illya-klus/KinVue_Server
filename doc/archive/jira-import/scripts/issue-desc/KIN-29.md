## Goal

Let users schedule future watch sessions that auto-open Redis rooms and notify invitees.

## Scope

`scheduled_rooms` table, CRUD, scheduler, web UI, tests.

## Out of scope

Do not redesign room WebSocket protocol in this epic.

## Suggested order

1. KIN-601: `scheduled_rooms` table + CRUD endpoints
2. KIN-602: Scheduler opens Redis room when due + emits invites
3. KIN-603: Schedule watch UI on movie detail + scheduled rooms page
4. KIN-604: Tests: create, cancel, due open, invitee notification

## References

- 28_JIRA_BACKLOG.md
