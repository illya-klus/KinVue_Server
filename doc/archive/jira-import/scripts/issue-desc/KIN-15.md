## Goal

Deliver movie catalog CRUD, publish/schedule, Meilisearch indexing, watchlist, and reconciliation.

## Scope

Admin and public movie endpoints, Meilisearch upsert, scheduled publish worker, search rebuild CLI, tests.

## Out of scope

Do not build web pages or media upload/transcode in this epic.

## Suggested order

1. KIN-311: Admin: `POST /admin/movies`, `PATCH /admin/movies/:id` (DRAFT status)
2. KIN-312: Admin: publish now + schedule publish endpoints
3. KIN-313: Public: `GET /movies/:id`, `GET /movies/search` (PUBLISHED only)
4. KIN-314: Watchlist: add, remove, list
5. KIN-315: Meilisearch index setup + upsert on publish
6. KIN-316: Scheduled publish worker (every 60s)
7. KIN-317: Search reconciliation job (every 5 min, 24h overlap, safe checkpoint)
8. KIN-318: CLI `search:rebuild` for full Meilisearch rebuild
9. KIN-319: Tests: publish, schedule, Meilisearch failure recovery, watchlist, search filters

## References

- 28_JIRA_BACKLOG.md
