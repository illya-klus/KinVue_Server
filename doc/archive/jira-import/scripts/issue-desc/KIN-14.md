## Goal

Define Movie PostgreSQL schema for catalog, uploads, watchlist, search sync state, and outbox.

## Scope

Migrations for `movies`, `movie_uploads`, `watchlist_items`, `movie_index_sync_state`, `movie_outbox_events`.

## Out of scope

Do not implement search API or admin UI in this epic.

## Suggested order

1. KIN-301: Add Movie DB migrations: `movies`, status constraint, indexes
2. KIN-302: Add `movie_uploads`, `watchlist_items`, `movie_index_sync_state`, `movie_outbox_events`

## References

- 28_JIRA_BACKLOG.md
