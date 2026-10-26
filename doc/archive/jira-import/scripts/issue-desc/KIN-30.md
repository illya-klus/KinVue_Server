## Goal

Comprehensive automated coverage of user journeys, failure modes, and load baselines.

## Scope

20 E2E journeys, failure tests, load scripts, capacity documentation.

## Out of scope

Do not change production architecture — test and measure only.

## Suggested order

1. KIN-701: E2E suite: all 20 user journeys from implementation plan Phase 29
2. KIN-702: Failure tests: Gateway/Auth/Users/Rooms/Redis/Meilisearch/RabbitMQ/transcode scenarios
3. KIN-703: Load test scripts: Gateway, search, Rooms WS, chat, notifications, media
4. KIN-704: Document capacity results in `docs/runbooks/capacity-results.md`

## References

- 28_JIRA_BACKLOG.md
