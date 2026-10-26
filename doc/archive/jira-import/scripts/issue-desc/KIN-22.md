## Goal

Reliable in-app notifications from RabbitMQ friendship and room-invite events with dedup and DLQ.

## Scope

Queue topology, consumer with manual ACK, dedup store, read API, Gateway routes, bell UI, tests.

## Out of scope

Do not implement push notifications or email in v1.

## Suggested order

1. KIN-501: RabbitMQ topology: exchange, queue, DLQ, bindings for friendship + room invite events
2. KIN-502: Consumer with manual ACK, 2 retries, DLQ on exhaustion
3. KIN-503: Dedup by `eventId` + in-app notifications store
4. KIN-504: `GET /notifications` + mark-as-read endpoint
5. KIN-505: Gateway routes + web notification bell UI
6. KIN-506: Tests: ACK timing, retry, DLQ, duplicate suppression

## References

- 28_JIRA_BACKLOG.md
