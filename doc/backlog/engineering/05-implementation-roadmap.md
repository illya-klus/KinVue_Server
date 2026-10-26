# Implementation roadmap

The order below is the implementation plan's order, adjusted so decision tickets happen before the code they parameterize. Stages match the ticket `execution_phase` field.

## Stage 0 — Discovery and architecture

Accept or replace the stack, token policy, username rules, room TTLs, movie state model, invite URL, admin bootstrap, notification channel, and hosting class. Record non-goals. Defer FR-09, password reset, email verification, DRM, and the 100k deployment.

Exit: decision log entries exist for every E-00 ticket that a Stage 2 ticket cites.

## Stage 1 — Foundation

Toolchain, gitignore, pnpm workspace, Turborepo, TypeScript, formatter, linter, Compose, environment example, shared packages, and service skeletons including the Rooms WebSocket port and the worker image.

Exit: `/health/live` responds on ports 4000-4005 and Compose data services are healthy.

## Stage 2 — Core backend

Auth schema and token lifecycle, Users schema and profile API, registration saga, friendships and the Users outbox, Gateway routing and limits, movie schema, catalog and publish APIs, Meilisearch setup and reconciliation, watchlist, Rooms HTTP, WebSocket access and presence, playback fan-out, and ephemeral chat.

Exit: the service tests named in those tickets pass without the browser.

## Stage 3 — Frontend

Web shell, session refresh, register, login, profile, friends, admin movie pages, debounced search, watchlist, room lobby, player controls, chat, notification list, upload panel, and schedule screens. Screens land as their APIs land. They do not need to be one block at the end.

Exit: component tests cover the primary screens and the home-page smoke passes.

## Stage 4 — Integrations

Notification topology and consumer, direct multipart upload, FFmpeg HLS, signed media access, and scheduled watch opening. The room player then uses the signed URL.

Exit: a fixture video plays through a signed URL, and a friend-request event becomes an in-app notification.

## Stage 5 — Quality and hardening

Metrics, three Grafana dashboards, internal-route audit, body limits, CORS, authorization regression, journey tests, failure tests, and local load notes. Full paper-scale load is post-MVP.

Exit: the Phase 29 journeys and the failure notes that can be automated are green.

## Stage 6 — Deployment

CI, cost worksheet, managed dependencies inside the budget, images, migrations, CDN signing, and deployed smoke. Stop if the worksheet exceeds $300 per month.

Exit: login, WSS handshake, and one signed playlist succeed on the deployed host.

## Stage 7 — Production readiness

Backup and rollback notes, documentation alignment, the acceptance checklist, and the `v0.1.0-mvp` tag. The tag is an operator action after the checklist. This planning pass does not create it.

## Earliest MVP

The earliest useful demo is registration, login, published-movie search, and solo signed playback. The documented MVP definition of done is larger. It includes friendships, rooms, sync, chat, reactions, notifications, scheduling, CI, core failure tests, and dashboards. Use `06-mvp-scope.md` for that cut.
