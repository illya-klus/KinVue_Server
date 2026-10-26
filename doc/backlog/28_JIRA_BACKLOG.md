# KinVue Jira Backlog — Tech Lead Task Breakdown

> Coarse cut of the build plan. The plan file is `doc/plan/27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md`. The finer local list is `doc/backlog/engineering/`. Tickets are already on the Jira board. Do not create a second set from this file. Descriptions in `doc/archive/jira-import/` repeat stories under keys that do not match this document.

> **Purpose:** Junior-ready Jira backlog derived from `27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md`.
>
> **How to use:** Create one Epic per section below, then create Stories/Tasks under each Epic in order. Do not start a Story until its dependencies are Done.
>
> **Estimates:** Story points use Fibonacci. `1` = half day, `2` = 1 day, `3` = 2 days, `5` = 3-4 days, `8` = 1 week.

---

## Labels To Create In Jira

`backend` `frontend` `infra` `auth` `users` `movies` `rooms` `notifications` `media` `gateway` `testing` `observability` `security` `docs` `blocked-by-infra` `junior-friendly` `needs-review`

---

## Jira Description Template (required for every issue)

Every Jira issue must explain **what to do** before listing acceptance criteria. Juniors should understand the task without reading the full implementation plan.

### Story / Task template

```markdown
## What to do

[2-5 sentences: what work to perform, why it matters in KinVue, where in the codebase]

## Technical notes

- [concrete hints: files, endpoints, ports, services, tools]

## Story points

{N}

## Depends on

{issue keys or —}

## Acceptance criteria

- [verifiable bullets]

## References

- 28_JIRA_BACKLOG.md
- 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md — Phase {N}
```

### Epic template

```markdown
## Goal

[what this epic delivers]

## Scope

[included work]

## Out of scope

[what NOT to build here]

## Suggested order

[ordered child issues]

## References

- 28_JIRA_BACKLOG.md
```

---

## Sprint 0 — Foundation (Week 1)

### Epic KIN-0: Developer Environment & Repo Bootstrap

| Key   | Type  | Summary                                                                                         | SP  | Labels                 | Depends On |
| ----- | ----- | ----------------------------------------------------------------------------------------------- | --- | ---------------------- | ---------- |
| KIN-1 | Task  | Install local toolchain (Node 20, pnpm, Docker, FFmpeg) and verify versions                     | 1   | infra, junior-friendly | —          |
| KIN-2 | Task  | Initialize git repo, add `.gitignore`, commit docs pack                                         | 1   | docs                   | KIN-1      |
| KIN-3 | Story | Bootstrap pnpm + Turbo monorepo with root scripts (`dev`, `build`, `test`, `lint`, `typecheck`) | 2   | infra                  | KIN-2      |
| KIN-4 | Story | Add strict root TypeScript + Prettier config                                                    | 1   | infra                  | KIN-3      |
| KIN-5 | Story | Create target folder structure (`apps/`, `packages/`, `infra/`, `tests/`, `scripts/`, `docs/`)  | 1   | infra                  | KIN-3      |

**KIN-3 Acceptance Criteria**

- `pnpm install` succeeds
- `pnpm build` runs (even if apps are empty stubs)
- Workspace includes `apps/*`, `packages/*`, `tests/*`

---

### Epic KIN-10: Local Infrastructure (Docker Compose)

| Key    | Type  | Summary                                                                                                      | SP  | Labels                  | Depends On             |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------ | --- | ----------------------- | ---------------------- |
| KIN-11 | Story | Create `infra/docker-compose.yml` with Auth PostgreSQL (5433) and Movie PostgreSQL (5434)                    | 2   | infra, blocked-by-infra | KIN-5                  |
| KIN-12 | Story | Add MongoDB, Redis, RabbitMQ (with management UI), Meilisearch, MinIO to Docker Compose                      | 3   | infra                   | KIN-11                 |
| KIN-13 | Story | Add MinIO bucket init service for `kinvue-media`                                                             | 2   | infra, media            | KIN-12                 |
| KIN-14 | Story | Add Prometheus + Grafana to Docker Compose                                                                   | 2   | infra, observability    | KIN-12                 |
| KIN-15 | Task  | Create `.env.example` with all required env vars and document port map                                       | 1   | infra, docs             | KIN-12                 |
| KIN-16 | Task  | Verify all infra containers healthy (`docker compose ps`, RabbitMQ UI, MinIO console, Meilisearch `/health`) | 1   | infra, testing          | KIN-13, KIN-14, KIN-15 |

**KIN-12 Acceptance Criteria**

- `pnpm infra:up` starts all containers
- RabbitMQ UI reachable at `localhost:15672`
- MinIO console reachable at `localhost:9001`
- Meilisearch health returns OK

---

### Epic KIN-20: Shared Packages

| Key    | Type  | Summary                                                                                                               | SP  | Labels                  | Depends On    |
| ------ | ----- | --------------------------------------------------------------------------------------------------------------------- | --- | ----------------------- | ------------- |
| KIN-21 | Story | Create `packages/config` with Zod-validated env loading per service                                                   | 3   | backend                 | KIN-5         |
| KIN-22 | Story | Create `packages/logger` with structured JSON logs (`service`, `requestId`, `userId`, `route`, `durationMs`, `error`) | 2   | backend, observability  | KIN-21        |
| KIN-23 | Story | Create `packages/errors` with shared error codes and HTTP mapping                                                     | 2   | backend                 | KIN-21        |
| KIN-24 | Story | Create `packages/jwt` with RS256 JWKS verification helper                                                             | 3   | backend, auth, security | KIN-21        |
| KIN-25 | Story | Create `packages/contracts` with shared DTOs and domain event types                                                   | 3   | backend                 | KIN-23        |
| KIN-26 | Story | Create `packages/testing` with DB/Redis/Mongo cleanup helpers and HTTP test utilities                                 | 3   | backend, testing        | KIN-21        |
| KIN-27 | Task  | Add unit tests for config, errors, logger, JWT validation failures                                                    | 2   | testing                 | KIN-21–KIN-26 |

---

### Epic KIN-30: Service Skeletons

| Key    | Type  | Summary                                                                       | SP  | Labels                 | Depends On            |
| ------ | ----- | ----------------------------------------------------------------------------- | --- | ---------------------- | --------------------- |
| KIN-31 | Story | Scaffold `apps/gateway` with health, readiness, metrics, shared error format  | 3   | backend, gateway       | KIN-22–KIN-26         |
| KIN-32 | Story | Scaffold `apps/auth-service` with health, readiness, metrics                  | 2   | backend, auth          | KIN-22–KIN-26         |
| KIN-33 | Story | Scaffold `apps/users-service` with health, readiness, metrics                 | 2   | backend, users         | KIN-22–KIN-26         |
| KIN-34 | Story | Scaffold `apps/movie-service` with health, readiness, metrics                 | 2   | backend, movies        | KIN-22–KIN-26         |
| KIN-35 | Story | Scaffold `apps/rooms-service` with HTTP health + separate WS port placeholder | 3   | backend, rooms         | KIN-22–KIN-26         |
| KIN-36 | Story | Scaffold `apps/notifications-service` with health, readiness, metrics         | 2   | backend, notifications | KIN-22–KIN-26         |
| KIN-37 | Story | Scaffold `apps/transcode-worker` with health + queue consumer stub            | 2   | backend, media         | KIN-22–KIN-26         |
| KIN-38 | Task  | Add Dockerfile for each app and wire all services into `docker-compose.yml`   | 3   | infra                  | KIN-31–KIN-37, KIN-16 |
| KIN-39 | Task  | Verify all service health endpoints on ports 4000–4005                        | 1   | testing                | KIN-38                |

---

## Sprint 1 — Auth + Users Backend (Week 2)

### Epic KIN-100: Auth Data Model

| Key     | Type  | Summary                                                                    | SP  | Labels        | Depends On      |
| ------- | ----- | -------------------------------------------------------------------------- | --- | ------------- | --------------- |
| KIN-101 | Story | Add Auth DB migrations: `auth_identities`, status constraint, unique email | 3   | backend, auth | KIN-32, KIN-16  |
| KIN-102 | Story | Add `refresh_sessions` table with indexes                                  | 2   | backend, auth | KIN-101         |
| KIN-103 | Story | Add `auth_outbox_events` table                                             | 2   | backend, auth | KIN-101         |
| KIN-104 | Task  | Write migration test that applies schema to empty test DB                  | 2   | testing, auth | KIN-101–KIN-103 |

---

### Epic KIN-110: Users Data Model

| Key     | Type  | Summary                                                                    | SP  | Labels         | Depends On     |
| ------- | ----- | -------------------------------------------------------------------------- | --- | -------------- | -------------- |
| KIN-111 | Story | Create Mongo `users` collection schema with unique lowercase username      | 3   | backend, users | KIN-33, KIN-16 |
| KIN-112 | Story | Create Mongo `friendships` collection with canonical pair normalization    | 3   | backend, users | KIN-111        |
| KIN-113 | Task  | Add indexes for username, displayName, user1Id, user2Id, status, createdAt | 2   | backend, users | KIN-112        |
| KIN-114 | Task  | Test duplicate friendship prevention in both directions                    | 2   | testing, users | KIN-112        |

---

### Epic KIN-120: Auth Service API

| Key     | Type  | Summary                                                                              | SP  | Labels                  | Depends On       |
| ------- | ----- | ------------------------------------------------------------------------------------ | --- | ----------------------- | ---------------- |
| KIN-121 | Story | Implement Argon2id password hashing + RS256 key generation                           | 3   | backend, auth, security | KIN-101          |
| KIN-122 | Story | Expose `GET /.well-known/jwks.json`                                                  | 2   | backend, auth           | KIN-121          |
| KIN-123 | Story | Implement `POST /auth/login` (ACTIVE users only, returns access + refresh tokens)    | 3   | backend, auth           | KIN-121, KIN-102 |
| KIN-124 | Story | Implement `POST /auth/refresh` with refresh token rotation                           | 3   | backend, auth           | KIN-123          |
| KIN-125 | Story | Implement `POST /auth/logout` (revoke refresh session)                               | 2   | backend, auth           | KIN-124          |
| KIN-126 | Story | Implement registration Saga in `POST /auth/register`                                 | 5   | backend, auth           | KIN-101, KIN-111 |
| KIN-127 | Task  | Unit tests: hashing, token claims, refresh rotation, inactive login, duplicate email | 3   | testing, auth           | KIN-123–KIN-126  |
| KIN-128 | Task  | Integration tests: successful Saga, Users unavailable retry, compensation path       | 5   | testing, auth           | KIN-126          |

**KIN-126 Acceptance Criteria**

- Generates global `userId` before DB write
- Status flow: `PENDING` → `PROFILE_CREATING` → `ACTIVE`
- Calls `POST /internal/users/profiles` idempotently
- Returns 201 only when Auth + Users both exist
- Retries Users 3x, then compensates with 503
- Duplicate email returns 409

---

### Epic KIN-130: Users Service API

| Key     | Type  | Summary                                                                                | SP  | Labels                        | Depends On      |
| ------- | ----- | -------------------------------------------------------------------------------------- | --- | ----------------------------- | --------------- |
| KIN-131 | Story | Implement idempotent `POST /internal/users/profiles`                                   | 3   | backend, users                | KIN-111         |
| KIN-132 | Story | Implement `GET /users/me` and `PATCH /users/me`                                        | 3   | backend, users                | KIN-131         |
| KIN-133 | Story | Implement `GET /users/search` (min 2 chars, cursor pagination)                         | 3   | backend, users                | KIN-131         |
| KIN-134 | Story | Implement friend requests: create, incoming, outgoing, accept, reject                  | 5   | backend, users                | KIN-112         |
| KIN-135 | Story | Implement `GET /friends`                                                               | 2   | backend, users                | KIN-134         |
| KIN-136 | Story | Emit `FRIEND_REQUEST_CREATED` and `FRIEND_REQUEST_ACCEPTED` via Mongo outbox           | 3   | backend, users, notifications | KIN-134         |
| KIN-137 | Story | Build outbox publisher to RabbitMQ for friendship events                               | 3   | backend, users, notifications | KIN-136, KIN-12 |
| KIN-138 | Task  | Tests: idempotent profile, pair normalization, authz on accept/reject, outbox creation | 3   | testing, users                | KIN-131–KIN-137 |

---

## Sprint 2 — Gateway + Web Shell (Week 3)

### Epic KIN-200: API Gateway

| Key     | Type  | Summary                                                                                                   | SP  | Labels                     | Depends On       |
| ------- | ----- | --------------------------------------------------------------------------------------------------------- | --- | -------------------------- | ---------------- |
| KIN-201 | Story | Add request ID middleware and forward `x-request-id`, `x-user-id`, `x-user-scopes`                        | 2   | backend, gateway           | KIN-31           |
| KIN-202 | Story | Implement public routes (register, login, refresh, JWKS, movie search/detail)                             | 3   | backend, gateway           | KIN-201, KIN-122 |
| KIN-203 | Story | Implement JWT middleware with JWKS cache (5 min) + unknown `kid` refresh                                  | 3   | backend, gateway, security | KIN-24, KIN-122  |
| KIN-204 | Story | Implement authenticated user routes (users, friends, watchlist, rooms control, media-access)              | 5   | backend, gateway           | KIN-203          |
| KIN-205 | Story | Implement admin routes with `admin` scope guard                                                           | 3   | backend, gateway, security | KIN-203          |
| KIN-206 | Story | Add rate limits per endpoint group                                                                        | 3   | backend, gateway, security | KIN-202–KIN-205  |
| KIN-207 | Task  | Gateway tests: expired JWT 401, bad signature 401, missing scope 403, upstream 503, request ID forwarding | 3   | testing, gateway           | KIN-204–KIN-206  |

---

### Epic KIN-210: Web App Foundation

| Key     | Type  | Summary                                                              | SP  | Labels             | Depends On |
| ------- | ----- | -------------------------------------------------------------------- | --- | ------------------ | ---------- |
| KIN-211 | Story | Create Vite React TS app with routing shell                          | 3   | frontend           | KIN-3      |
| KIN-212 | Story | Build API client (Gateway-only HTTP) + auth state store              | 3   | frontend           | KIN-211    |
| KIN-213 | Story | Implement auto refresh on 401 + logout flow                          | 3   | frontend, auth     | KIN-212    |
| KIN-214 | Story | Add protected and admin route wrappers                               | 2   | frontend, security | KIN-213    |
| KIN-215 | Story | Add shared UI states: loading, empty, error, unauthorized, forbidden | 2   | frontend           | KIN-211    |
| KIN-216 | Task  | Playwright smoke test: homepage loads                                | 1   | frontend, testing  | KIN-211    |

---

### Epic KIN-220: Auth UI Vertical Slice

| Key     | Type  | Summary                                                                      | SP  | Labels         | Depends On                |
| ------- | ----- | ---------------------------------------------------------------------------- | --- | -------------- | ------------------------- |
| KIN-221 | Story | Build register page with validation (password min 12 chars)                  | 3   | frontend, auth | KIN-212, KIN-126          |
| KIN-222 | Story | Build login page + redirect to movie search                                  | 2   | frontend, auth | KIN-212, KIN-123          |
| KIN-223 | Story | Handle duplicate email/username error messages                               | 2   | frontend, auth | KIN-221                   |
| KIN-224 | Task  | E2E: register → login → profile loads                                        | 3   | testing, auth  | KIN-221, KIN-222, KIN-132 |
| KIN-225 | Task  | Manual failure test: kill Users during registration, verify no false success | 2   | testing, auth  | KIN-224                   |

---

### Epic KIN-230: Social UI Vertical Slice

| Key     | Type  | Summary                                                                 | SP  | Labels          | Depends On       |
| ------- | ----- | ----------------------------------------------------------------------- | --- | --------------- | ---------------- |
| KIN-231 | Story | Build profile view + edit form                                          | 3   | frontend, users | KIN-132, KIN-214 |
| KIN-232 | Story | Build user search page (min 2 chars)                                    | 2   | frontend, users | KIN-133          |
| KIN-233 | Story | Build friend requests UI (send, incoming, outgoing, accept, reject)     | 5   | frontend, users | KIN-134          |
| KIN-234 | Story | Build friends list page                                                 | 2   | frontend, users | KIN-135          |
| KIN-235 | Task  | E2E: user A finds user B, sends request, B accepts, both see friendship | 3   | testing, users  | KIN-233, KIN-234 |

---

## Sprint 3 — Movies (Week 4)

### Epic KIN-300: Movie Data Model

| Key     | Type  | Summary                                                                                 | SP  | Labels          | Depends On     |
| ------- | ----- | --------------------------------------------------------------------------------------- | --- | --------------- | -------------- |
| KIN-301 | Story | Add Movie DB migrations: `movies`, status constraint, indexes                           | 3   | backend, movies | KIN-34, KIN-16 |
| KIN-302 | Story | Add `movie_uploads`, `watchlist_items`, `movie_index_sync_state`, `movie_outbox_events` | 3   | backend, movies | KIN-301        |

---

### Epic KIN-310: Movie Service API

| Key     | Type  | Summary                                                                           | SP  | Labels          | Depends On      |
| ------- | ----- | --------------------------------------------------------------------------------- | --- | --------------- | --------------- |
| KIN-311 | Story | Admin: `POST /admin/movies`, `PATCH /admin/movies/:id` (DRAFT status)             | 3   | backend, movies | KIN-301         |
| KIN-312 | Story | Admin: publish now + schedule publish endpoints                                   | 3   | backend, movies | KIN-311         |
| KIN-313 | Story | Public: `GET /movies/:id`, `GET /movies/search` (PUBLISHED only)                  | 3   | backend, movies | KIN-311         |
| KIN-314 | Story | Watchlist: add, remove, list                                                      | 3   | backend, movies | KIN-302         |
| KIN-315 | Story | Meilisearch index setup + upsert on publish                                       | 3   | backend, movies | KIN-312, KIN-12 |
| KIN-316 | Story | Scheduled publish worker (every 60s)                                              | 3   | backend, movies | KIN-312         |
| KIN-317 | Story | Search reconciliation job (every 5 min, 24h overlap, safe checkpoint)             | 5   | backend, movies | KIN-315         |
| KIN-318 | Task  | CLI `search:rebuild` for full Meilisearch rebuild                                 | 2   | backend, movies | KIN-315         |
| KIN-319 | Task  | Tests: publish, schedule, Meilisearch failure recovery, watchlist, search filters | 5   | testing, movies | KIN-313–KIN-318 |

---

### Epic KIN-320: Movie UI

| Key     | Type  | Summary                                                         | SP  | Labels           | Depends On       |
| ------- | ----- | --------------------------------------------------------------- | --- | ---------------- | ---------------- |
| KIN-321 | Story | Admin movie create/edit pages                                   | 3   | frontend, movies | KIN-311, KIN-214 |
| KIN-322 | Story | Admin publish now + schedule publish UI                         | 2   | frontend, movies | KIN-312          |
| KIN-323 | Story | Movie search page with 300ms debounce + min 2 chars             | 3   | frontend, movies | KIN-313          |
| KIN-324 | Story | Movie detail page + watchlist add/remove                        | 3   | frontend, movies | KIN-314          |
| KIN-325 | Story | Watchlist page                                                  | 2   | frontend, movies | KIN-314          |
| KIN-326 | Task  | E2E: admin publishes movie → user searches → saves to watchlist | 3   | testing, movies  | KIN-321–KIN-325  |

---

## Sprint 4 — Rooms Core (Week 5-6)

### Epic KIN-400: Rooms HTTP Control API

| Key     | Type  | Summary                                                                              | SP  | Labels                        | Depends On      |
| ------- | ----- | ------------------------------------------------------------------------------------ | --- | ----------------------------- | --------------- |
| KIN-401 | Story | Redis key helpers and room state/member schemas                                      | 3   | backend, rooms                | KIN-35, KIN-16  |
| KIN-402 | Story | `POST /rooms` (private/public, capacity 20, 6h TTL)                                  | 3   | backend, rooms                | KIN-401         |
| KIN-403 | Story | `GET /rooms/public`                                                                  | 2   | backend, rooms                | KIN-402         |
| KIN-404 | Story | `POST /rooms/:id/invites` (owner only, default VIEWER) + `ROOM_INVITED` outbox event | 3   | backend, rooms, notifications | KIN-402         |
| KIN-405 | Story | `POST /rooms/:id/permissions` (owner grants CONTROLLER)                              | 3   | backend, rooms                | KIN-402         |
| KIN-406 | Story | `POST /rooms/:id/close` (owner only, 15 min cleanup TTL)                             | 2   | backend, rooms                | KIN-402         |
| KIN-407 | Task  | Tests: create, invite authz, permission changes, close, TTL, capacity                | 3   | testing, rooms                | KIN-402–KIN-406 |

---

### Epic KIN-410: Rooms WebSocket + Presence

| Key     | Type  | Summary                                                                    | SP  | Labels                   | Depends On      |
| ------- | ----- | -------------------------------------------------------------------------- | --- | ------------------------ | --------------- |
| KIN-411 | Story | WebSocket endpoint `ws://localhost:4014/rooms` with JWT handshake          | 5   | backend, rooms, security | KIN-401, KIN-24 |
| KIN-412 | Story | Room access checks (public/private, closed, capacity, invite list)         | 3   | backend, rooms           | KIN-411         |
| KIN-413 | Story | Send `room.state_sync` on connect                                          | 2   | backend, rooms           | KIN-411         |
| KIN-414 | Story | Heartbeat every 30s, stale after 75s, presence ONLINE/DISCONNECTED/LEFT    | 3   | backend, rooms           | KIN-411         |
| KIN-415 | Task  | Tests: valid handshake, invalid JWT, private access denial, reconnect sync | 3   | testing, rooms           | KIN-411–KIN-414 |

---

### Epic KIN-420: Playback Synchronization

| Key     | Type  | Summary                                                                          | SP  | Labels         | Depends On |
| ------- | ----- | -------------------------------------------------------------------------------- | --- | -------------- | ---------- |
| KIN-421 | Story | Handle `room.play`, `room.pause`, `room.seek` with permission checks             | 5   | backend, rooms | KIN-414    |
| KIN-422 | Story | Store sync point in Redis (`status`, `position`, `updatedAt`, `version`)         | 3   | backend, rooms | KIN-421    |
| KIN-423 | Story | Redis Pub/Sub fan-out across Rooms instances (subscribe only active rooms)       | 5   | backend, rooms | KIN-422    |
| KIN-424 | Story | Broadcast `room.playback_state_changed` with monotonic version                   | 3   | backend, rooms | KIN-423    |
| KIN-425 | Task  | Multi-instance test: user A pauses on instance 1, user B receives on instance 2  | 5   | testing, rooms | KIN-424    |
| KIN-426 | Task  | Reconnect test: client receives authoritative Redis state without Pub/Sub replay | 3   | testing, rooms | KIN-424    |

---

### Epic KIN-430: Room Chat & Reactions

| Key     | Type  | Summary                                                                | SP  | Labels         | Depends On      |
| ------- | ----- | ---------------------------------------------------------------------- | --- | -------------- | --------------- |
| KIN-431 | Story | `chat.message` with client `messageId`, 1000 char limit, Redis TTL 24h | 3   | backend, rooms | KIN-414         |
| KIN-432 | Story | Idempotent chat retry using `seenMessageIds` set                       | 3   | backend, rooms | KIN-431         |
| KIN-433 | Story | `chat.reaction` with allowed emoji set                                 | 2   | backend, rooms | KIN-431         |
| KIN-434 | Task  | Tests: validation, duplicate messageId, cross-instance delivery        | 3   | testing, rooms | KIN-431–KIN-433 |

---

### Epic KIN-440: Room Web Experience

| Key     | Type  | Summary                                                                     | SP  | Labels                 | Depends On       |
| ------- | ----- | --------------------------------------------------------------------------- | --- | ---------------------- | ---------------- |
| KIN-441 | Story | Create room UI from movie detail (solo/private/public)                      | 3   | frontend, rooms        | KIN-402, KIN-324 |
| KIN-442 | Story | Public rooms list + join flow                                               | 3   | frontend, rooms        | KIN-403          |
| KIN-443 | Story | Invite friend UI + copy invite URL                                          | 2   | frontend, rooms        | KIN-404          |
| KIN-444 | Story | Participants list + owner permission controls                               | 3   | frontend, rooms        | KIN-405          |
| KIN-445 | Story | HLS player integrated with room playback state (owner/controller vs viewer) | 5   | frontend, rooms, media | KIN-424          |
| KIN-446 | Story | Chat panel + reaction buttons in room page                                  | 3   | frontend, rooms        | KIN-431–KIN-433  |
| KIN-447 | Story | Reconnect banner + wait for `room.state_sync` before local controls         | 2   | frontend, rooms        | KIN-445          |
| KIN-448 | Task  | E2E: 2-browser play/pause/seek/chat/reaction/reconnect test                 | 5   | testing, rooms         | KIN-441–KIN-447  |

---

## Sprint 5 — Notifications + Media (Week 7-8)

### Epic KIN-500: Notifications Service

| Key     | Type  | Summary                                                                               | SP  | Labels                  | Depends On       |
| ------- | ----- | ------------------------------------------------------------------------------------- | --- | ----------------------- | ---------------- |
| KIN-501 | Story | RabbitMQ topology: exchange, queue, DLQ, bindings for friendship + room invite events | 3   | backend, notifications  | KIN-12           |
| KIN-502 | Story | Consumer with manual ACK, 2 retries, DLQ on exhaustion                                | 3   | backend, notifications  | KIN-501          |
| KIN-503 | Story | Dedup by `eventId` + in-app notifications store                                       | 3   | backend, notifications  | KIN-502          |
| KIN-504 | Story | `GET /notifications` + mark-as-read endpoint                                          | 2   | backend, notifications  | KIN-503          |
| KIN-505 | Story | Gateway routes + web notification bell UI                                             | 3   | frontend, notifications | KIN-504, KIN-204 |
| KIN-506 | Task  | Tests: ACK timing, retry, DLQ, duplicate suppression                                  | 3   | testing, notifications  | KIN-502–KIN-504  |

---

### Epic KIN-510: Admin Media Upload

| Key     | Type  | Summary                                                                                          | SP  | Labels                 | Depends On      |
| ------- | ----- | ------------------------------------------------------------------------------------------------ | --- | ---------------------- | --------------- |
| KIN-511 | Story | `POST /admin/movies/:id/upload/init` — metadata first, presigned multipart URLs                  | 5   | backend, movies, media | KIN-302, KIN-13 |
| KIN-512 | Story | `POST /admin/movies/:id/upload/complete` — finalize multipart, set PROCESSING, enqueue transcode | 3   | backend, movies, media | KIN-511         |
| KIN-513 | Story | Abandoned upload cleanup job (24h)                                                               | 3   | backend, movies, media | KIN-511         |
| KIN-514 | Story | Admin upload UI with direct-to-MinIO multipart + failed-part retry                               | 5   | frontend, media        | KIN-511         |
| KIN-515 | Task  | Tests: metadata-first, presigned URLs, complete flow, abandoned cleanup                          | 3   | testing, media         | KIN-511–KIN-513 |

---

### Epic KIN-520: Transcoding Worker

| Key     | Type  | Summary                                                                              | SP  | Labels         | Depends On      |
| ------- | ----- | ------------------------------------------------------------------------------------ | --- | -------------- | --------------- |
| KIN-521 | Story | RabbitMQ queue `media.transcode` + job schema                                        | 2   | backend, media | KIN-512         |
| KIN-522 | Story | FFmpeg worker: download original, generate HLS 1080p/720p/480p, upload to MinIO      | 8   | backend, media | KIN-521         |
| KIN-523 | Story | Internal callbacks: transcode-complete → READY, transcode-failed → PROCESSING_FAILED | 3   | backend, media | KIN-522         |
| KIN-524 | Story | Retry up to 3 attempts before failure                                                | 2   | backend, media | KIN-522         |
| KIN-525 | Task  | Fixture video test: verify playable HLS output                                       | 3   | testing, media | KIN-522–KIN-524 |

---

### Epic KIN-530: Signed Media Playback

| Key     | Type  | Summary                                                                                  | SP  | Labels                           | Depends On       |
| ------- | ----- | ---------------------------------------------------------------------------------------- | --- | -------------------------------- | ---------------- |
| KIN-531 | Story | `POST /movies/:id/media-access` — auth required, READY/PUBLISHED only, 10 min signed URL | 3   | backend, movies, media, security | KIN-523          |
| KIN-532 | Story | Web player requests media-access before HLS load                                         | 2   | frontend, media                  | KIN-531, KIN-445 |
| KIN-533 | Task  | Tests: unauthorized, expired URL, wrong state, successful playback                       | 3   | testing, media                   | KIN-531–KIN-532  |
| KIN-534 | Task  | Verify app services never proxy video bytes                                              | 1   | testing, media, security         | KIN-532          |

---

## Sprint 6 — Scheduling + Hardening (Week 9-10)

### Epic KIN-600: Scheduled Watch Rooms

| Key     | Type  | Summary                                                  | SP  | Labels                 | Depends On       |
| ------- | ----- | -------------------------------------------------------- | --- | ---------------------- | ---------------- |
| KIN-601 | Story | `scheduled_rooms` table + CRUD endpoints                 | 3   | backend, rooms, movies | KIN-302, KIN-402 |
| KIN-602 | Story | Scheduler opens Redis room when due + emits invites      | 3   | backend, rooms         | KIN-601          |
| KIN-603 | Story | Schedule watch UI on movie detail + scheduled rooms page | 3   | frontend, rooms        | KIN-601          |
| KIN-604 | Task  | Tests: create, cancel, due open, invitee notification    | 3   | testing, rooms         | KIN-602, KIN-503 |

---

### Epic KIN-610: Observability

| Key     | Type  | Summary                                                       | SP  | Labels                 | Depends On      |
| ------- | ----- | ------------------------------------------------------------- | --- | ---------------------- | --------------- |
| KIN-611 | Story | Prometheus metrics for all services (HTTP + Rooms WS metrics) | 5   | backend, observability | KIN-39          |
| KIN-612 | Story | Grafana dashboards: Overview, Rooms, Media                    | 3   | observability          | KIN-611, KIN-14 |
| KIN-613 | Task  | Write `docs/runbooks/observability.md`                        | 1   | docs, observability    | KIN-612         |

---

### Epic KIN-620: Security Hardening

| Key     | Type  | Summary                                                                                                   | SP  | Labels            | Depends On       |
| ------- | ----- | --------------------------------------------------------------------------------------------------------- | --- | ----------------- | ---------------- |
| KIN-621 | Story | Input validation + body size limits on all external endpoints                                             | 3   | backend, security | KIN-204          |
| KIN-622 | Story | CORS allowlist, secret scanning, dependency scanning in CI                                                | 3   | security, infra   | KIN-28           |
| KIN-623 | Story | Security tests: private room denial, viewer playback denial, admin guard, expired JWT, upload type denial | 5   | testing, security | KIN-448, KIN-514 |
| KIN-624 | Task  | Write `docs/runbooks/security.md`                                                                         | 1   | docs, security    | KIN-623          |

---

### Epic KIN-630: CI/CD Pipeline

| Key     | Type  | Summary                                                 | SP  | Labels         | Depends On      |
| ------- | ----- | ------------------------------------------------------- | --- | -------------- | --------------- |
| KIN-631 | Story | GitHub Actions: install, lint, typecheck, unit tests    | 3   | infra, testing | KIN-27          |
| KIN-632 | Story | CI: Docker Compose integration tests + Playwright smoke | 5   | infra, testing | KIN-631, KIN-16 |
| KIN-633 | Task  | Upload test artifacts on CI failure                     | 1   | infra, testing | KIN-632         |

---

## Sprint 7 — QA, Load, Deploy (Week 11-12)

### Epic KIN-700: End-to-End Test Suite

| Key     | Type  | Summary                                                                                | SP  | Labels        | Depends On                                           |
| ------- | ----- | -------------------------------------------------------------------------------------- | --- | ------------- | ---------------------------------------------------- |
| KIN-701 | Story | E2E suite: all 20 user journeys from implementation plan Phase 29                      | 8   | testing       | KIN-448, KIN-326, KIN-235, KIN-505, KIN-532, KIN-604 |
| KIN-702 | Story | Failure tests: Gateway/Auth/Users/Rooms/Redis/Meilisearch/RabbitMQ/transcode scenarios | 8   | testing       | KIN-701                                              |
| KIN-703 | Story | Load test scripts: Gateway, search, Rooms WS, chat, notifications, media               | 5   | testing       | KIN-611                                              |
| KIN-704 | Task  | Document capacity results in `docs/runbooks/capacity-results.md`                       | 2   | docs, testing | KIN-703                                              |

---

### Epic KIN-710: MVP Deployment

| Key     | Type  | Summary                                                                                     | SP  | Labels      | Depends On |
| ------- | ----- | ------------------------------------------------------------------------------------------- | --- | ----------- | ---------- |
| KIN-711 | Story | Production Dockerfiles + env documentation                                                  | 3   | infra       | KIN-38     |
| KIN-712 | Story | Provision MVP infra (DBs, Redis, RabbitMQ, object storage, CDN) within <= $300/month budget | 5   | infra       | KIN-711    |
| KIN-713 | Story | Deploy services + run migrations + smoke tests                                              | 5   | infra       | KIN-712    |
| KIN-714 | Task  | Write `docs/runbooks/deployment.md`                                                         | 1   | docs, infra | KIN-713    |

---

### Epic KIN-720: Documentation Refresh & Release

| Key     | Type | Summary                                                                    | SP  | Labels        | Depends On       |
| ------- | ---- | -------------------------------------------------------------------------- | --- | ------------- | ---------------- |
| KIN-721 | Task | Update README, implementation plan references, open questions, data models | 2   | docs          | KIN-713          |
| KIN-722 | Task | Final acceptance checklist (Phase 34) — all FR/NFR verified                | 3   | testing, docs | KIN-701, KIN-702 |
| KIN-723 | Task | Tag release `v0.1.0-mvp`                                                   | 1   | infra         | KIN-722          |

---

## Dependency Graph (Critical Path)

```text
KIN-1 → KIN-3 → KIN-16 → KIN-39 → KIN-126 → KIN-204 → KIN-224
KIN-16 → KIN-315 → KIN-326
KIN-39 → KIN-424 → KIN-448 → KIN-532 → KIN-701 → KIN-722
```

---

## Junior Assignment Guide

| Developer Level    | Good First Tasks                                              |
| ------------------ | ------------------------------------------------------------- |
| Junior (week 1-2)  | KIN-1, KIN-15, KIN-16, KIN-27, KIN-39, KIN-216, KIN-223       |
| Junior (week 3+)   | KIN-221, KIN-222, KIN-231, KIN-323, KIN-324, KIN-325, KIN-446 |
| Mid-level          | KIN-126, KIN-203, KIN-315, KIN-411, KIN-423, KIN-511, KIN-522 |
| Senior / Tech Lead | KIN-128, KIN-317, KIN-425, KIN-502, KIN-612, KIN-712          |

---

## Definition Of Done (Every Story)

- Code merged to `main` with PR review
- Unit tests added/updated and passing
- Integration or E2E test added when story touches user flow
- No secrets committed
- Logs and metrics added for new endpoints/events
- README or runbook updated if setup changed
- Story acceptance criteria verified by reviewer

---

## Requirement Traceability

| Requirement                 | Epic(s)                                     |
| --------------------------- | ------------------------------------------- |
| FR-01–FR-04 Auth            | KIN-120, KIN-200, KIN-220                   |
| FR-05–FR-09 Social          | KIN-130, KIN-230                            |
| FR-10–FR-15 Movies          | KIN-300, KIN-310, KIN-320, KIN-510, KIN-520 |
| FR-16–FR-21 Playback        | KIN-420, KIN-440, KIN-530                   |
| FR-22–FR-31 Rooms           | KIN-400, KIN-410, KIN-420, KIN-440          |
| FR-32–FR-35 Realtime        | KIN-410, KIN-420, KIN-430                   |
| FR-36–FR-37 Scheduling      | KIN-600                                     |
| NFR-01–NFR-07 Scale/Latency | KIN-420, KIN-703                            |
| NFR-08–NFR-10 Consistency   | KIN-317, KIN-420                            |
| NFR-11–NFR-12 Durability    | KIN-510, KIN-500                            |
| NFR-13–NFR-14 Chat          | KIN-430                                     |
| NFR-15 Cost                 | KIN-712                                     |

---

## Jira Import Notes

When creating in Jira:

1. Create **Epic** issues first (use Epic names from section headers).
2. Link each Story/Task to its Epic.
3. Add **Blocks** links for dependencies in the Depends On column.
4. Use labels from the top of this document.
5. Paste Acceptance Criteria from story sections into Jira Description.
6. Set Priority: Sprint 0-2 = Highest, Sprint 3-5 = High, Sprint 6-7 = Medium.

**Total backlog:** 23 Epics, 115 Stories/Tasks, ~310 story points.
