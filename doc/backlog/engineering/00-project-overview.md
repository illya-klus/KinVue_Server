# KinVue project overview

KinVue is a social watch-together product. A person registers, finds a movie, watches it alone or in a private or public room, and keeps playback aligned with the other people in that room. Room members chat and react. An admin creates the movie, uploads the file directly to object storage, waits for HLS transcoding, and publishes immediately or at a scheduled time.

These backlog files were first written as if the repository held only the design pack. That is no longer true of KinVue_Server. `services/gateway` and `services/auth` exist, contracts live in `packages/shared-protos`, and local Postgres is described in `docker-compose.yml`. What is actually built is `doc/architecture.md`. Ticket statuses in this folder were not re-checked against that code: do not mark a ticket done from this overview, and do not treat the server as empty.

The plan's `apps/` tree is not this repo. Code stays in `services/*` and `packages/*` until a ticket moves it. `services/chat` is an empty Nest scaffold. The design pack keeps chat inside Rooms and does not add a Chat Service.

## What was read

The second pass re-read every project document before touching tickets: `00_README.md` through `28_JIRA_BACKLOG.md`, `manifest.json`, and all 148 files in `scripts/issue-desc/` (`KIN-11.md` through `KIN-158.md`; numbers 1–10 and many later keys are absent). `28_JIRA_BACKLOG.md` is an earlier, coarser backlog of 23 epics and 115 stories derived from document 27. The issue-desc files repeat that backlog with the keys scrambled. `KIN-126.md` describes movie search, while document 28 assigns KIN-126 to the registration saga. Later files duplicate the same stories again. They add no endpoint, rule, or flow that documents 00–27 do not already state. Import scripts were not treated as product requirements, and this pass did not add tickets from them.

## Scale and budget

The architecture is shaped for 100,000 concurrent users, about 40,000 of them in rooms, about 8,000 rooms, and about 46,000 video streams. The MVP deployment budget is at most $300 per month. Those are different constraints. The MVP must keep the same service boundaries and must not purchase the paper-scale footprint.

## Systems

KinVue v1 is a modular monolith of deployable services, not a platform of independently invented microservices:

- Gateway for HTTP, local JWT checks, rate limits, and route proxying.
- Auth for credentials, tokens, and the registration saga. Auth PostgreSQL.
- Users for profiles and friendships. MongoDB.
- Movie for catalog, watchlist, search orchestration, upload authorization, and signed playback. Movie PostgreSQL. Meilisearch is a rebuildable projection.
- Rooms for ephemeral room state, WebSocket ingress, playback, chat, and reactions. Redis is the live state store.
- Notifications for at-least-once in-app delivery from RabbitMQ.
- Transcode worker for HLS. Object storage and CDN carry the bytes.
- Web client. The implementation plan proposes React and Vite. Documents 00-26 do not choose a frontend framework.

There is no Chat Service and no Streaming Service in v1. Redis Pub/Sub is not a durable bus. RabbitMQ is the durable bus for notification-worthy events and, in the implementation plan, for transcode jobs.

## Status of the work

| Area                          | Evidence                                                                                                             | Status                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Product and architecture docs | Files 00-27 exist                                                                                                    | Written                                                 |
| Coarser Jira breakdown        | `28_JIRA_BACKLOG.md`                                                                                                 | Written, and its exported descriptions are inconsistent |
| Application services          | Gateway, auth, and the contracts package exist. Users, rooms, movie, notifications, media, and the web client do not | Partial                                                 |

## Backlog counts

- Epics: 39
- Features: 101
- Atomic tickets: 308
- Dependency edges: 626
- Estimated effort: 775 hours
- MVP: 307 tickets, 772 hours
- Post-MVP: 1 tickets, 3 hours
- Open gaps recorded: 20
- Contradictions recorded: 10

Estimates assume one engineer who already knows this pack. Use about ±35% until the decision tickets in E-00 are accepted and a first service exists to measure against. One engineer has about 775 hours of work. The longest dependency chain is 34 tickets and 85 hours. That chain is a staffing lower bound, not the project total. Auth, catalog, and rooms can proceed beside each other once the skeletons exist.

## How to use the files

- `epics.md` and `02-epics-and-features.md` list epics and features.
- `tickets.md` and `03-master-backlog.md` are the full ticket text.
- `tickets.csv` is the board-import file. `backlog.csv` adds scope, files, verification, and testing columns.
- `dependencies.md` and `04-dependency-graph.md` explain order.
- Do not create external tickets from this pack until someone asks. These files are the local source.
