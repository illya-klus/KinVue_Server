## Goal

Ephemeral in-room chat and emoji reactions over WebSocket with Redis storage and idempotent retries.

## Scope

`chat.message`, `chat.reaction`, Redis TTL, duplicate messageId handling, tests.

## Out of scope

Do not build room page UI or durable chat history in this epic.

## Suggested order

1. KIN-431: `chat.message` with client `messageId`, 1000 char limit, Redis TTL 24h
2. KIN-432: Idempotent chat retry using `seenMessageIds` set
3. KIN-433: `chat.reaction` with allowed emoji set
4. KIN-434: Tests: validation, duplicate messageId, cross-instance delivery

## References

- 28_JIRA_BACKLOG.md
