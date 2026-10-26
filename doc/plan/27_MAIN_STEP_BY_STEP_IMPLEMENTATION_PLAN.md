# KinVue Main Step-by-Step Implementation Plan

> Files `00`–`26` and `manifest.json` live in `doc/design/`. This file lives in `doc/plan/`. The finer ticket list is `doc/backlog/engineering/`. Choices under "Implementation Decisions Fixed For This Plan" close open questions so work can start; gaps in `doc/backlog/engineering/09-gaps-and-unknowns.md` are still open and are not requirements.

> This plan is written so an engineer can build KinVue step by step from the current documentation pack without making new architecture decisions during implementation.

**Goal:** Build KinVue, a social watch-together platform with authentication, profiles, friendships, movie search, saved movies, private/public watch rooms, synchronized playback, realtime chat/reactions, notifications, admin media upload, async transcoding, and signed media playback.

**Architecture:** KinVue uses separate paths for HTTP API, realtime WebSocket traffic, and media delivery. API traffic goes through a stateless Gateway, realtime room traffic goes directly to the Rooms service, and video bytes are served from object storage/CDN instead of application servers.

**Chosen implementation stack for this plan:** TypeScript monorepo, Node.js 20, pnpm workspaces, NestJS-style HTTP services, React/Vite web client, PostgreSQL for Auth and Movie, MongoDB for Users, Redis HA-compatible usage for Rooms state and Pub/Sub, RabbitMQ for notification events, Meilisearch for movie search, MinIO for local S3-compatible object storage, FFmpeg-based transcoding workers, Docker Compose for local development.

**Spec source:** This plan was derived from every existing root file in the current documentation pack: `00_README.md`, `01_PRODUCT_OVERVIEW.md`, `02_REQUIREMENTS.md`, `03_CAPACITY_ESTIMATION.md`, `04_HIGH_LEVEL_ARCHITECTURE.md`, `05_SERVICE_BOUNDARIES.md`, `06_AUTH_AND_REGISTRATION.md`, `07_USERS_AND_SOCIAL_GRAPH.md`, `08_ROOMS_REALTIME_AND_CHAT.md`, `09_MOVIE_SEARCH_AND_INDEXING.md`, `10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md`, `11_NOTIFICATIONS_MESSAGING_RELIABILITY.md`, `12_DATA_OWNERSHIP_AND_CONSISTENCY.md`, `13_DISTRIBUTED_SYSTEM_PATTERNS.md`, `14_FAILURE_AND_RECOVERY_NOTES.md`, `15_SEQUENCE_DIAGRAMS.md`, `16_ARCHITECTURE_DECISIONS.md`, `17_DECISION_LOG.md`, `18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md`, `19_IMPLEMENTATION_PLAN.md`, `20_TESTING_AND_VALIDATION_PLAN.md`, `21_OBSERVABILITY_AND_METRICS.md`, `22_SECURITY_MODEL.md`, `23_DATA_MODELS_DRAFT.md`, `24_SCALING_AND_DEPLOYMENT_STRATEGY.md`, `25_RISKS_AND_TRADEOFFS.md`, `26_GLOSSARY.md`, and `manifest.json`.

## Global Constraints

- Do not proxy media bytes through Gateway, Movie Service, or any other application service.
- Keep Gateway responsible for HTTP edge concerns: routing, JWT validation, rate limiting, request context, and API composition.
- Keep Rooms WebSocket ingress separate from Gateway.
- Validate JWTs locally in Gateway and Rooms; Auth is not called on every authenticated request.
- Use one immutable global `userId` across Auth, Users, Rooms, chat, notifications, and projections.
- Do not create distributed database foreign keys between services.
- Auth owns identity, credentials, refresh/session state, and registration state.
- Users owns profile, preferences, friendships, and social data.
- Movie owns movie metadata, movie lifecycle, media keys, publish state, and search indexing responsibility.
- PostgreSQL is the Movie source of truth.
- Meilisearch is a rebuildable search projection.
- Rooms owns ephemeral room lifecycle, room permissions, playback state, presence, chat, and reactions.
- Redis stores current active room state, room membership/presence, Pub/Sub fan-out, and ephemeral chat history.
- Chat stays inside Rooms for v1.
- Do not create a separate Chat Service in v1.
- Do not create a separate Streaming Service in v1.
- Notifications use RabbitMQ with manual ACK, two retries, and DLQ.
- Important durable business events use Transactional Outbox.
- Ephemeral play, pause, seek, reaction, and presence events do not use Transactional Outbox.
- Search result Redis caching is not part of v1.
- Meilisearch scales vertically first; horizontal search topology requires benchmark evidence.
- Rooms accept last-processed-wins behavior for simultaneous play, pause, and seek commands.
- Room event propagation target is under 200 ms.
- Chat delivery target is under 500 ms.
- Movie search target is under 1-2 seconds.
- Demo/MVP infrastructure target is <= $300/month.
- The 100,000 concurrent user target is an architecture model, not the required MVP deployment size.

## Implementation Decisions Fixed For This Plan

These choices close open questions from `18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md` so implementation can proceed without stopping.

- Access token TTL: 15 minutes.
- Refresh token TTL: 30 days.
- Refresh token policy: rotate on every refresh and revoke the previous token.
- JWT signing: RS256 with local JWKS endpoint from Auth.
- Password hashing: Argon2id.
- Registration status values: `PENDING`, `PROFILE_CREATING`, `ACTIVE`, `COMPENSATING`, `COMPENSATED`, `DISABLED`.
- Username rule: unique, lowercase, 3-30 characters, letters, numbers, underscore, dot.
- User search v1: MongoDB text/regex search on username and display name with pagination.
- Friendship pagination: cursor pagination using `createdAt` and `_id`.
- Watchlist ownership: Movie Service stores `userId` + `movieId` watchlist rows because watchlist is movie-domain behavior.
- Room TTL: expire after 6 hours of inactivity.
- Closed room retention: delete Redis room state 15 minutes after close.
- Chat TTL: 24 hours for active rooms; delete with room close cleanup.
- Room heartbeat: client sends heartbeat every 30 seconds; server marks stale after 75 seconds.
- Presence values: `ONLINE`, `DISCONNECTED`, `LEFT`.
- Room permissions: `OWNER`, `CONTROLLER`, `VIEWER`.
- Private room access: owner, current participants, and invited users only.
- Public room access: authenticated users can join until room capacity is reached.
- Room capacity v1: 20 participants.
- Playback state version: implement monotonic integer `version` even though strict ordering is not required; clients ignore older versions.
- Movie search debounce: 300 ms in the web client.
- Movie search minimum query length: 2 characters.
- Movie reconciliation: incremental every 5 minutes with 24-hour overlap plus manual full rebuild command.
- Scheduled publish worker: runs every 60 seconds.
- Media format: HLS only for v1.
- Bitrate ladder: 1080p at 5 Mbps, 720p at 3 Mbps, 480p at 1.5 Mbps.
- Transcoding implementation: FFmpeg container worker for local and MVP.
- Transcoding retry count: 3 attempts, then `PROCESSING_FAILED`.
- Abandoned upload cleanup: mark upload abandoned after 24 hours without completion.
- Original media retention: keep originals for v1.
- Signed media access: short-lived signed CDN URL in production, signed MinIO URL in local development.
- Signed media URL TTL: 10 minutes.
- Notification provider for v1 local: in-app notification store plus logged fake push provider.
- Notification dedup store: Notifications PostgreSQL table keyed by `eventId`.
- DLQ replay v1: CLI script that reads messages from DLQ and republishes selected messages.
- Observability stack local: structured JSON logs, Prometheus metrics endpoints, Grafana via Docker Compose.
- CI provider: GitHub Actions.
- Deployment target for MVP: containerized services on a small cloud VM or managed container platform, managed databases only where the monthly budget allows.

## Target Repository Structure

Create this structure in the root:

```text
apps/
  web/
  gateway/
  auth-service/
  users-service/
  movie-service/
  rooms-service/
  notifications-service/
  transcode-worker/
packages/
  contracts/
  config/
  logger/
  jwt/
  errors/
  testing/
infra/
  docker-compose.yml
  docker/
  grafana/
  prometheus/
  rabbitmq/
scripts/
  dev/
  db/
  search/
  mq/
tests/
  e2e/
  load/
  fixtures/
docs/
  api/
  runbooks/
```

## Port Map

Use these ports consistently:

```text
web: 3000
gateway: 4000
auth-service: 4001
users-service: 4002
movie-service: 4003
rooms-service http: 4004
rooms-service websocket: 4014
notifications-service: 4005
postgres auth: 5433
postgres movie: 5434
mongodb users: 27017
redis: 6379
rabbitmq amqp: 5672
rabbitmq management: 15672
meilisearch: 7700
minio api: 9000
minio console: 9001
prometheus: 9090
grafana: 3001
```

## Phase 0 - Workstation And Repository Preparation

- [ ] Step 0.1: Install Node.js 20 LTS.
- [ ] Step 0.2: Install pnpm globally.

```bash
npm install -g pnpm
```

- [ ] Step 0.3: Install Docker Desktop.
- [ ] Step 0.4: Install FFmpeg locally for manual media checks.
- [ ] Step 0.5: Verify versions.

```bash
node --version
pnpm --version
docker --version
ffmpeg -version
```

- [ ] Step 0.6: Initialize git if the root is not already a git repository.

```bash
git init
git branch -M main
```

- [ ] Step 0.7: Create `.gitignore`.

```text
node_modules
dist
coverage
.env
.env.*
!.env.example
.turbo
.vite
playwright-report
test-results
tmp
uploads
*.log
```

- [ ] Step 0.8: Commit the existing documentation pack and this plan before app code starts.

```bash
git add .
git commit -m "docs: capture kinvue architecture and implementation plan"
```

## Phase 1 - Monorepo Foundation

- [ ] Step 1.1: Create the root `package.json`.

```json
{
  "name": "kinvue",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:e2e": "pnpm --filter @kinvue/e2e test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write .",
    "infra:up": "docker compose -f infra/docker-compose.yml up -d",
    "infra:down": "docker compose -f infra/docker-compose.yml down",
    "infra:logs": "docker compose -f infra/docker-compose.yml logs -f"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.6.0",
    "prettier": "^3.3.0"
  }
}
```

- [ ] Step 1.2: Create `pnpm-workspace.yaml`.

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tests/*"
```

- [ ] Step 1.3: Create `turbo.json`.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "outputs": []
    }
  }
}
```

- [ ] Step 1.4: Create root `tsconfig.base.json` with strict TypeScript settings.
- [ ] Step 1.5: Create root `.prettierrc`.

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100
}
```

- [ ] Step 1.6: Install root dependencies.

```bash
pnpm install
```

- [ ] Step 1.7: Commit the monorepo foundation.

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .prettierrc .gitignore
git commit -m "chore: set up kinvue monorepo"
```

## Phase 2 - Local Infrastructure

- [ ] Step 2.1: Create `infra/docker-compose.yml`.
- [ ] Step 2.2: Add Auth PostgreSQL service named `auth-postgres`.
- [ ] Step 2.3: Add Movie PostgreSQL service named `movie-postgres`.
- [ ] Step 2.4: Add MongoDB service named `users-mongo`.
- [ ] Step 2.5: Add Redis service named `rooms-redis`.
- [ ] Step 2.6: Add RabbitMQ service named `rabbitmq` with management UI.
- [ ] Step 2.7: Add Meilisearch service named `meilisearch`.
- [ ] Step 2.8: Add MinIO service named `minio`.
- [ ] Step 2.9: Add MinIO bucket initialization service that creates `kinvue-media`.
- [ ] Step 2.10: Add Prometheus service.
- [ ] Step 2.11: Add Grafana service.
- [ ] Step 2.12: Create `.env.example` with every required local variable.

```text
NODE_ENV=development
AUTH_DATABASE_URL=postgresql://kinvue_auth:kinvue_auth@localhost:5433/kinvue_auth
MOVIE_DATABASE_URL=postgresql://kinvue_movie:kinvue_movie@localhost:5434/kinvue_movie
USERS_MONGO_URL=mongodb://localhost:27017/kinvue_users
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://kinvue:kinvue@localhost:5672
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=kinvue_meili_master_key
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=kinvue_minio
S3_SECRET_KEY=kinvue_minio_secret
S3_BUCKET=kinvue-media
JWT_ISSUER=kinvue-auth
JWT_AUDIENCE=kinvue
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
MEDIA_URL_TTL_SECONDS=600
```

- [ ] Step 2.13: Copy `.env.example` to `.env`.
- [ ] Step 2.14: Start local infrastructure.

```bash
pnpm infra:up
```

- [ ] Step 2.15: Verify containers are healthy.

```bash
docker compose -f infra/docker-compose.yml ps
```

- [ ] Step 2.16: Open RabbitMQ management at `http://localhost:15672`.
- [ ] Step 2.17: Open MinIO console at `http://localhost:9001`.
- [ ] Step 2.18: Open Meilisearch health endpoint at `http://localhost:7700/health`.
- [ ] Step 2.19: Commit local infrastructure.

```bash
git add infra .env.example
git commit -m "chore: add local infrastructure"
```

## Phase 3 - Shared Packages

- [ ] Step 3.1: Create `packages/config`.
- [ ] Step 3.2: Implement config loading with Zod validation.
- [ ] Step 3.3: Export one config schema per service so missing environment variables fail at startup.
- [ ] Step 3.4: Create `packages/logger`.
- [ ] Step 3.5: Implement structured JSON logger with `service`, `requestId`, `userId`, `route`, `durationMs`, and `error`.
- [ ] Step 3.6: Create `packages/errors`.
- [ ] Step 3.7: Define shared error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, `INTERNAL`.
- [ ] Step 3.8: Create `packages/jwt`.
- [ ] Step 3.9: Implement RS256 JWT verify helper that accepts JWKS public keys and checks issuer, audience, expiration, and scopes.
- [ ] Step 3.10: Create `packages/contracts`.
- [ ] Step 3.11: Define shared DTOs and event types for Auth, Users, Movies, Rooms, and Notifications.
- [ ] Step 3.12: Create `packages/testing`.
- [ ] Step 3.13: Add test helpers for HTTP requests, test users, test movies, Redis cleanup, Mongo cleanup, and PostgreSQL cleanup.
- [ ] Step 3.14: Add package-level unit tests for config validation, error mapping, logger shape, and JWT validation failure cases.
- [ ] Step 3.15: Run package tests.

```bash
pnpm test
pnpm typecheck
```

- [ ] Step 3.16: Commit shared packages.

```bash
git add packages
git commit -m "chore: add shared packages"
```

## Phase 4 - Service Skeletons

- [ ] Step 4.1: Create `apps/gateway`.
- [ ] Step 4.2: Create `apps/auth-service`.
- [ ] Step 4.3: Create `apps/users-service`.
- [ ] Step 4.4: Create `apps/movie-service`.
- [ ] Step 4.5: Create `apps/rooms-service`.
- [ ] Step 4.6: Create `apps/notifications-service`.
- [ ] Step 4.7: Create `apps/transcode-worker`.
- [ ] Step 4.8: Each service must expose `GET /health/live`.
- [ ] Step 4.9: Each HTTP service must expose `GET /health/ready`.
- [ ] Step 4.10: Each service must log startup config without secrets.
- [ ] Step 4.11: Each service must expose Prometheus metrics at `GET /metrics`.
- [ ] Step 4.12: Each service must return JSON errors using the shared error format.
- [ ] Step 4.13: Each service must include unit test, integration test, build, lint, and typecheck scripts.
- [ ] Step 4.14: Add Dockerfile for every service.
- [ ] Step 4.15: Add every service to `infra/docker-compose.yml`.
- [ ] Step 4.16: Start all services locally.

```bash
pnpm infra:up
pnpm dev
```

- [ ] Step 4.17: Verify all health endpoints.

```bash
curl http://localhost:4000/health/live
curl http://localhost:4001/health/live
curl http://localhost:4002/health/live
curl http://localhost:4003/health/live
curl http://localhost:4004/health/live
curl http://localhost:4005/health/live
```

- [ ] Step 4.18: Commit service skeletons.

```bash
git add apps infra
git commit -m "chore: scaffold kinvue services"
```

## Phase 5 - Auth Service Data Model

- [ ] Step 5.1: Add Prisma or SQL migration tooling to `apps/auth-service`.
- [ ] Step 5.2: Create `auth_identities` table.

```text
user_id uuid primary key
email text not null unique
password_hash text not null
status text not null
created_at timestamptz not null
updated_at timestamptz not null
```

- [ ] Step 5.3: Add status check constraint allowing `PENDING`, `PROFILE_CREATING`, `ACTIVE`, `COMPENSATING`, `COMPENSATED`, `DISABLED`.
- [ ] Step 5.4: Create `refresh_sessions` table.

```text
id uuid primary key
user_id uuid not null
token_hash text not null unique
rotated_from_session_id uuid null
revoked_at timestamptz null
expires_at timestamptz not null
created_at timestamptz not null
updated_at timestamptz not null
```

- [ ] Step 5.5: Create `auth_outbox_events` table for future durable Auth events.

```text
event_id uuid primary key
type text not null
payload jsonb not null
status text not null default 'PENDING'
created_at timestamptz not null
published_at timestamptz null
retry_count integer not null default 0
```

- [ ] Step 5.6: Add database indexes for `refresh_sessions.user_id`, `refresh_sessions.expires_at`, and `auth_outbox_events.status`.
- [ ] Step 5.7: Write migration tests that create the schema in an empty test database.
- [ ] Step 5.8: Run Auth migrations locally.
- [ ] Step 5.9: Commit Auth schema.

```bash
git add apps/auth-service
git commit -m "feat(auth): add identity and session schema"
```

## Phase 6 - Users Service Data Model

- [ ] Step 6.1: Add Mongoose or native MongoDB repository layer to `apps/users-service`.
- [ ] Step 6.2: Create `users` collection schema.

```text
userId string unique required
username string unique required lowercase
displayName string required
avatar string null
preferences object with genres, languages, autoplay
createdAt date required
updatedAt date required
```

- [ ] Step 6.3: Create `friendships` collection schema.

```text
id string unique required
user1Id string required
user2Id string required
requestedBy string required
status PENDING | ACCEPTED | REJECTED
createdAt date required
updatedAt date required
```

- [ ] Step 6.4: Add unique compound index `{ user1Id: 1, user2Id: 1 }`.
- [ ] Step 6.5: Add indexes for `username`, `displayName`, `user1Id`, `user2Id`, `status`, and `createdAt`.
- [ ] Step 6.6: Implement helper `normalizeFriendshipPair(a, b)` returning `{ user1Id: min, user2Id: max }`.
- [ ] Step 6.7: Test that duplicate friendship pairs cannot be created in either direction.
- [ ] Step 6.8: Test that usernames are unique and normalized to lowercase.
- [ ] Step 6.9: Commit Users schema.

```bash
git add apps/users-service
git commit -m "feat(users): add profile and friendship schema"
```

## Phase 7 - Movie Service Data Model

- [ ] Step 7.1: Add migration tooling to `apps/movie-service`.
- [ ] Step 7.2: Create `movies` table.

```text
movie_id uuid primary key
title text not null
description text not null
genres text[] not null
duration_seconds integer null
poster_key text null
status text not null
publish_at timestamptz null
media_original_key text null
media_hls_master_key text null
created_by_user_id uuid not null
created_at timestamptz not null
updated_at timestamptz not null
```

- [ ] Step 7.3: Add status check constraint allowing `DRAFT`, `SCHEDULED`, `UPLOADING`, `PROCESSING`, `READY`, `PUBLISHED`, `UPLOAD_FAILED`, `PROCESSING_FAILED`, `ABANDONED`.
- [ ] Step 7.4: Create `movie_uploads` table.

```text
upload_id uuid primary key
movie_id uuid not null
s3_upload_id text not null
original_key text not null
status text not null
part_count integer not null
expires_at timestamptz not null
created_at timestamptz not null
completed_at timestamptz null
```

- [ ] Step 7.5: Create `watchlist_items` table.

```text
user_id uuid not null
movie_id uuid not null
created_at timestamptz not null
primary key (user_id, movie_id)
```

- [ ] Step 7.6: Create `movie_index_sync_state` table with one row named `movies`.
- [ ] Step 7.7: Create `movie_outbox_events` table for future durable movie events.
- [ ] Step 7.8: Add indexes for movie status, publish time, update time, and watchlist user.
- [ ] Step 7.9: Run Movie migrations locally.
- [ ] Step 7.10: Commit Movie schema.

```bash
git add apps/movie-service
git commit -m "feat(movies): add catalog and upload schema"
```

## Phase 8 - Auth Service Behavior

- [ ] Step 8.1: Implement password hashing with Argon2id.
- [ ] Step 8.2: Implement key generation for RS256 JWT signing.
- [ ] Step 8.3: Store private signing key as an environment secret.
- [ ] Step 8.4: Expose Auth JWKS public keys at `GET /.well-known/jwks.json`.
- [ ] Step 8.5: Implement `POST /auth/register`.
- [ ] Step 8.6: Registration request body must be:

```json
{
  "email": "user@example.com",
  "password": "minimum-12-characters",
  "username": "movie_fan",
  "displayName": "Movie Fan"
}
```

- [ ] Step 8.7: Registration must generate global `userId` before writing Auth identity.
- [ ] Step 8.8: Registration must insert Auth identity with status `PENDING`.
- [ ] Step 8.9: Registration must set status to `PROFILE_CREATING` before calling Users.
- [ ] Step 8.10: Registration must call `POST /internal/users/profiles` with `userId`, `username`, and `displayName`.
- [ ] Step 8.11: Users profile creation must be idempotent for the same `userId`.
- [ ] Step 8.12: Registration must set Auth identity to `ACTIVE` only after Users confirms profile exists.
- [ ] Step 8.13: Registration must return 201 only after Auth is active and Users profile exists.
- [ ] Step 8.14: If Users is unavailable, retry profile creation three times with backoff.
- [ ] Step 8.15: If retries fail, set Auth identity to `COMPENSATING`, then `COMPENSATED`, and return 503.
- [ ] Step 8.16: If email already exists, return 409 from the database unique constraint.
- [ ] Step 8.17: Implement `POST /auth/login`.
- [ ] Step 8.18: Login must reject non-`ACTIVE` identities.
- [ ] Step 8.19: Login must return access token and refresh token.
- [ ] Step 8.20: Access token claims must include `sub`, `iss`, `aud`, `iat`, `exp`, `userId`, and `scopes`.
- [ ] Step 8.21: Implement `POST /auth/refresh`.
- [ ] Step 8.22: Refresh must validate session token hash, expiry, and revocation state.
- [ ] Step 8.23: Refresh must revoke the old refresh token and issue a new refresh token.
- [ ] Step 8.24: Implement `POST /auth/logout`.
- [ ] Step 8.25: Logout must revoke the current refresh session.
- [ ] Step 8.26: Add unit tests for password hashing, token claims, refresh rotation, inactive login rejection, and duplicate email.
- [ ] Step 8.27: Add integration tests for successful registration Saga and lost Users response retry.
- [ ] Step 8.28: Commit Auth behavior.

```bash
git add apps/auth-service packages
git commit -m "feat(auth): implement registration and token lifecycle"
```

## Phase 9 - Users Service Behavior

- [ ] Step 9.1: Implement internal endpoint `POST /internal/users/profiles`.
- [ ] Step 9.2: Internal profile creation request body must be:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "movie_fan",
  "displayName": "Movie Fan"
}
```

- [ ] Step 9.3: If a profile with the same `userId` already exists, return 200 with the existing profile.
- [ ] Step 9.4: If a different `userId` already uses the username, return 409.
- [ ] Step 9.5: Implement `GET /users/me`.
- [ ] Step 9.6: Implement `PATCH /users/me`.
- [ ] Step 9.7: Implement `GET /users/search?query=&limit=&cursor=`.
- [ ] Step 9.8: User search must require a query length of at least 2 characters.
- [ ] Step 9.9: Implement `POST /friend-requests`.
- [ ] Step 9.10: Friend request body must be:

```json
{
  "targetUserId": "550e8400-e29b-41d4-a716-446655440001"
}
```

- [ ] Step 9.11: Friend request must reject self-requests with 400.
- [ ] Step 9.12: Friend request must normalize user pair before insert.
- [ ] Step 9.13: Friend request must return 409 if the relationship already exists.
- [ ] Step 9.14: Implement `GET /friend-requests/incoming`.
- [ ] Step 9.15: Implement `GET /friend-requests/outgoing`.
- [ ] Step 9.16: Implement `POST /friend-requests/:id/accept`.
- [ ] Step 9.17: Accept must only allow the target user, not the requester.
- [ ] Step 9.18: Implement `POST /friend-requests/:id/reject`.
- [ ] Step 9.19: Implement `GET /friends`.
- [ ] Step 9.20: Create `FRIEND_REQUEST_CREATED` event after successful request creation.
- [ ] Step 9.21: Create `FRIEND_REQUEST_ACCEPTED` event after successful accept.
- [ ] Step 9.22: Store Users outbox events in MongoDB collection `outbox_events`.
- [ ] Step 9.23: Add outbox publisher that publishes pending friendship events to RabbitMQ.
- [ ] Step 9.24: Add tests for idempotent profile create, friend pair normalization, duplicate prevention, accept authorization, reject authorization, and outbox event creation.
- [ ] Step 9.25: Commit Users behavior.

```bash
git add apps/users-service packages
git commit -m "feat(users): implement profiles and friendships"
```

## Phase 10 - Gateway

- [ ] Step 10.1: Implement Gateway request ID middleware.
- [ ] Step 10.2: Implement public routes that do not require JWT.

```text
POST /auth/register -> auth-service POST /auth/register
POST /auth/login -> auth-service POST /auth/login
POST /auth/refresh -> auth-service POST /auth/refresh
GET /.well-known/jwks.json -> auth-service GET /.well-known/jwks.json
GET /movies/search -> movie-service GET /movies/search
GET /movies/:movieId -> movie-service GET /movies/:movieId
```

- [ ] Step 10.3: Implement authenticated route middleware using local JWKS validation.
- [ ] Step 10.4: Cache JWKS in memory for 5 minutes.
- [ ] Step 10.5: Refresh JWKS immediately when token `kid` is unknown.
- [ ] Step 10.6: Forward authenticated context headers to services.

```text
x-request-id
x-user-id
x-user-scopes
```

- [ ] Step 10.7: Implement authenticated user routes.

```text
POST /auth/logout -> auth-service POST /auth/logout
GET /users/me -> users-service GET /users/me
PATCH /users/me -> users-service PATCH /users/me
GET /users/search -> users-service GET /users/search
POST /friend-requests -> users-service POST /friend-requests
GET /friend-requests/incoming -> users-service GET /friend-requests/incoming
GET /friend-requests/outgoing -> users-service GET /friend-requests/outgoing
POST /friend-requests/:id/accept -> users-service POST /friend-requests/:id/accept
POST /friend-requests/:id/reject -> users-service POST /friend-requests/:id/reject
GET /friends -> users-service GET /friends
POST /movies/:movieId/watchlist -> movie-service POST /movies/:movieId/watchlist
DELETE /movies/:movieId/watchlist -> movie-service DELETE /movies/:movieId/watchlist
GET /watchlist -> movie-service GET /watchlist
POST /rooms -> rooms-service POST /rooms
GET /rooms/public -> rooms-service GET /rooms/public
POST /rooms/:roomId/invites -> rooms-service POST /rooms/:roomId/invites
POST /rooms/:roomId/close -> rooms-service POST /rooms/:roomId/close
POST /rooms/:roomId/permissions -> rooms-service POST /rooms/:roomId/permissions
POST /movies/:movieId/media-access -> movie-service POST /movies/:movieId/media-access
```

- [ ] Step 10.8: Implement admin-only route middleware using `admin` scope.
- [ ] Step 10.9: Implement admin routes.

```text
POST /admin/movies -> movie-service POST /admin/movies
PATCH /admin/movies/:movieId -> movie-service PATCH /admin/movies/:movieId
POST /admin/movies/:movieId/upload/init -> movie-service POST /admin/movies/:movieId/upload/init
POST /admin/movies/:movieId/upload/complete -> movie-service POST /admin/movies/:movieId/upload/complete
POST /admin/movies/:movieId/publish -> movie-service POST /admin/movies/:movieId/publish
POST /admin/movies/:movieId/schedule -> movie-service POST /admin/movies/:movieId/schedule
```

- [ ] Step 10.10: Add rate limits.

```text
/auth/login: 5 requests per minute per IP
/auth/register: 3 requests per minute per IP
/movies/search: 60 requests per minute per user or IP
/rooms: 30 requests per minute per user
default authenticated API: 300 requests per minute per user
```

- [ ] Step 10.11: Add Gateway tests for expired token 401, invalid signature 401, missing scope 403, upstream 503 mapping, and request ID forwarding.
- [ ] Step 10.12: Commit Gateway.

```bash
git add apps/gateway packages
git commit -m "feat(gateway): add routing and local jwt validation"
```

## Phase 11 - Web Application Foundation

- [ ] Step 11.1: Create Vite React TypeScript app in `apps/web`.
- [ ] Step 11.2: Add routes for register, login, movie search, movie detail, watchlist, profile, friends, public rooms, room page, and admin movies.
- [ ] Step 11.3: Add API client that talks only to Gateway for HTTP.
- [ ] Step 11.4: Add auth token storage in memory plus refresh token stored in secure HTTP-only cookie if backend cookie flow is implemented; if using JSON refresh tokens locally, store refresh token in memory during development only.
- [ ] Step 11.5: Add automatic access-token refresh on 401.
- [ ] Step 11.6: Add logout that clears local auth state and calls Gateway logout.
- [ ] Step 11.7: Add protected route wrapper.
- [ ] Step 11.8: Add admin route wrapper that checks admin scope.
- [ ] Step 11.9: Add shared UI states for loading, empty, error, unauthorized, and forbidden.
- [ ] Step 11.10: Add Playwright smoke test that opens the homepage.
- [ ] Step 11.11: Commit web foundation.

```bash
git add apps/web
git commit -m "feat(web): scaffold client application"
```

## Phase 12 - Registration And Login Vertical Slice

- [ ] Step 12.1: Build register form in `apps/web`.
- [ ] Step 12.2: Register form fields: email, username, display name, password, confirm password.
- [ ] Step 12.3: Validate password length at 12 characters minimum.
- [ ] Step 12.4: Submit register form to `POST /auth/register`.
- [ ] Step 12.5: Show duplicate email message when Gateway returns 409.
- [ ] Step 12.6: Show duplicate username message when Auth receives Users conflict.
- [ ] Step 12.7: Build login form.
- [ ] Step 12.8: Submit login form to `POST /auth/login`.
- [ ] Step 12.9: Store access token in auth state.
- [ ] Step 12.10: Redirect logged-in user to movie search.
- [ ] Step 12.11: Add E2E test for register -> login -> profile load.
- [ ] Step 12.12: Kill Users service during registration and verify registration does not return success.
- [ ] Step 12.13: Restart Users service and verify retry behavior using logs and database state.
- [ ] Step 12.14: Commit registration/login slice.

```bash
git add apps tests packages
git commit -m "feat: complete registration and login slice"
```

## Phase 13 - Profiles And Friendships Vertical Slice

- [ ] Step 13.1: Build profile page.
- [ ] Step 13.2: Display username, display name, avatar, preferences, and created date.
- [ ] Step 13.3: Add edit profile form for display name, avatar URL, genres, languages, and autoplay.
- [ ] Step 13.4: Build user search page.
- [ ] Step 13.5: Require two characters before user search request.
- [ ] Step 13.6: Build send friend request action.
- [ ] Step 13.7: Build incoming friend requests page.
- [ ] Step 13.8: Build outgoing friend requests page.
- [ ] Step 13.9: Build accept action.
- [ ] Step 13.10: Build reject action.
- [ ] Step 13.11: Build friends list page.
- [ ] Step 13.12: Add E2E test with two users: user A searches user B, sends request, user B accepts, both see each other in friends.
- [ ] Step 13.13: Verify RabbitMQ receives `FRIEND_REQUEST_CREATED` and `FRIEND_REQUEST_ACCEPTED`.
- [ ] Step 13.14: Commit profile/friendship slice.

```bash
git add apps tests
git commit -m "feat: complete profiles and friendships slice"
```

## Phase 14 - Movie Metadata And Search

- [ ] Step 14.1: Implement Movie repository functions for create, update, get by ID, publish now, schedule publish, list due scheduled movies, and watchlist operations.
- [ ] Step 14.2: Implement Meilisearch client.
- [ ] Step 14.3: Create Meilisearch index `movies`.
- [ ] Step 14.4: Configure searchable attributes: `title`, `description`, `genres`.
- [ ] Step 14.5: Configure filterable attributes: `genres`, `status`.
- [ ] Step 14.6: Configure sortable attributes: `title`, `createdAt`, `publishAt`.
- [ ] Step 14.7: Implement `POST /admin/movies`.
- [ ] Step 14.8: Admin create movie request body must be:

```json
{
  "title": "Interstellar",
  "description": "A science fiction movie about space travel.",
  "genres": ["sci-fi", "drama"],
  "durationSeconds": 10140,
  "posterKey": "posters/interstellar.jpg"
}
```

- [ ] Step 14.9: New admin-created movies start as `DRAFT`.
- [ ] Step 14.10: Implement `PATCH /admin/movies/:movieId`.
- [ ] Step 14.11: Implement `POST /admin/movies/:movieId/publish`.
- [ ] Step 14.12: Publish now must update PostgreSQL first.
- [ ] Step 14.13: Publish now must attempt immediate Meilisearch upsert after PostgreSQL succeeds.
- [ ] Step 14.14: If Meilisearch upsert fails, keep PostgreSQL state and rely on reconciliation.
- [ ] Step 14.15: Implement `POST /admin/movies/:movieId/schedule`.
- [ ] Step 14.16: Scheduled publish request body must be:

```json
{
  "publishAt": "2026-09-15T18:00:00.000Z"
}
```

- [ ] Step 14.17: Implement scheduled publish worker running every 60 seconds.
- [ ] Step 14.18: Implement `GET /movies/:movieId`.
- [ ] Step 14.19: Implement `GET /movies/search?q=&genres=&limit=&offset=`.
- [ ] Step 14.20: Search must only return `PUBLISHED` movies.
- [ ] Step 14.21: Implement `POST /movies/:movieId/watchlist`.
- [ ] Step 14.22: Implement `DELETE /movies/:movieId/watchlist`.
- [ ] Step 14.23: Implement `GET /watchlist`.
- [ ] Step 14.24: Implement reconciliation job with `from = lastSuccessfulSync - 24 hours` and `to = jobStartedAt`.
- [ ] Step 14.25: Move `lastSuccessfulSync` only after all Meilisearch upserts succeed.
- [ ] Step 14.26: Add CLI script `pnpm --filter movie-service search:rebuild` for full index rebuild.
- [ ] Step 14.27: Add tests for publish, scheduled publish, failed Meilisearch upsert, reconciliation checkpoint safety, watchlist add/remove, and search filters.
- [ ] Step 14.28: Commit movie metadata/search.

```bash
git add apps/movie-service scripts packages
git commit -m "feat(movies): implement catalog search and watchlist"
```

## Phase 15 - Movie Web Slice

- [ ] Step 15.1: Build admin movie create page.
- [ ] Step 15.2: Build admin movie edit page.
- [ ] Step 15.3: Build admin publish now action.
- [ ] Step 15.4: Build admin schedule publish action.
- [ ] Step 15.5: Build movie search page.
- [ ] Step 15.6: Debounce movie search input by 300 ms.
- [ ] Step 15.7: Do not send search request until query length is at least 2.
- [ ] Step 15.8: Build movie detail page.
- [ ] Step 15.9: Build add to watchlist action.
- [ ] Step 15.10: Build remove from watchlist action.
- [ ] Step 15.11: Build watchlist page.
- [ ] Step 15.12: Add E2E test: admin creates movie, publishes movie, user searches movie, opens details, saves to watchlist.
- [ ] Step 15.13: Commit movie web slice.

```bash
git add apps/web tests
git commit -m "feat(web): add movie search and watchlist"
```

## Phase 16 - Rooms HTTP Control

- [ ] Step 16.1: Implement Redis room key helpers.

```text
room:{roomId}:state
room:{roomId}:members
room:{roomId}:messages
room:{roomId}:seenMessageIds
room:{roomId}:events
```

- [ ] Step 16.2: Implement room state shape.

```json
{
  "roomId": "room_123",
  "ownerId": "user_123",
  "visibility": "PRIVATE",
  "movieId": "movie_123",
  "playbackStatus": "PAUSED",
  "positionSeconds": 0,
  "updatedAt": "2026-09-17T12:00:00.000Z",
  "version": 1,
  "capacity": 20,
  "closed": false,
  "expiresAt": "2026-09-17T18:00:00.000Z"
}
```

- [ ] Step 16.3: Implement member shape.

```json
{
  "userId": "user_123",
  "role": "OWNER",
  "presence": "ONLINE",
  "lastSeenAt": "2026-09-17T12:00:00.000Z"
}
```

- [ ] Step 16.4: Implement `POST /rooms`.
- [ ] Step 16.5: Create room request body must be:

```json
{
  "visibility": "PRIVATE",
  "movieId": "movie_123"
}
```

- [ ] Step 16.6: Validate visibility is `PRIVATE` or `PUBLIC`.
- [ ] Step 16.7: Validate room capacity defaults to 20.
- [ ] Step 16.8: Store room state in Redis with 6-hour TTL.
- [ ] Step 16.9: Store owner as room member with role `OWNER`.
- [ ] Step 16.10: Implement `GET /rooms/public`.
- [ ] Step 16.11: Implement `POST /rooms/:roomId/invites`.
- [ ] Step 16.12: Invite request body must be:

```json
{
  "targetUserId": "user_456",
  "role": "VIEWER"
}
```

- [ ] Step 16.13: Only owner can invite users.
- [ ] Step 16.14: Invited users default to `VIEWER`.
- [ ] Step 16.15: Emit `ROOM_INVITED` notification event through Rooms outbox.
- [ ] Step 16.16: Implement `POST /rooms/:roomId/permissions`.
- [ ] Step 16.17: Permission change request body must be:

```json
{
  "targetUserId": "user_456",
  "role": "CONTROLLER"
}
```

- [ ] Step 16.18: Only owner can change permissions.
- [ ] Step 16.19: Implement `POST /rooms/:roomId/close`.
- [ ] Step 16.20: Only owner can close a room.
- [ ] Step 16.21: Closing a room sets `closed = true` and shortens TTL to 15 minutes.
- [ ] Step 16.22: Add tests for private create, public create, owner-only invite, owner-only close, permission updates, TTL assignment, and capacity.
- [ ] Step 16.23: Commit Rooms HTTP control.

```bash
git add apps/rooms-service packages
git commit -m "feat(rooms): implement room control api"
```

## Phase 17 - Rooms WebSocket Handshake And Presence

- [ ] Step 17.1: Expose WebSocket endpoint at `ws://localhost:4014/rooms`.
- [ ] Step 17.2: Client must connect with `accessToken` and `roomId`.
- [ ] Step 17.3: Rooms service must validate JWT locally using JWKS.
- [ ] Step 17.4: Rooms service must reject missing, expired, malformed, or invalid tokens.
- [ ] Step 17.5: Rooms service must load room state from Redis.
- [ ] Step 17.6: Rooms service must reject unknown rooms.
- [ ] Step 17.7: Rooms service must reject closed rooms.
- [ ] Step 17.8: Rooms service must allow public room join for authenticated users when capacity is available.
- [ ] Step 17.9: Rooms service must allow private room join only for owner, existing participant, or invited user.
- [ ] Step 17.10: Rooms service must associate socket with `userId`, `roomId`, and role.
- [ ] Step 17.11: On connect, Rooms service must send `room.state_sync`.
- [ ] Step 17.12: Implement heartbeat event `presence.heartbeat`.
- [ ] Step 17.13: Mark member `ONLINE` on connect.
- [ ] Step 17.14: Mark member `DISCONNECTED` when heartbeat is stale for 75 seconds.
- [ ] Step 17.15: Mark member `LEFT` when client sends `room.leave`.
- [ ] Step 17.16: Publish presence updates to Redis Pub/Sub.
- [ ] Step 17.17: Broadcast presence updates to room participants.
- [ ] Step 17.18: Add tests for valid handshake, invalid JWT rejection, private access rejection, public join, stale heartbeat, and reconnect state sync.
- [ ] Step 17.19: Commit Rooms handshake/presence.

```bash
git add apps/rooms-service packages
git commit -m "feat(rooms): add websocket handshake and presence"
```

## Phase 18 - Playback Synchronization

- [ ] Step 18.1: Define WebSocket client-to-server playback events.

```text
room.play
room.pause
room.seek
```

- [ ] Step 18.2: Define server-to-client playback event.

```text
room.playback_state_changed
```

- [ ] Step 18.3: Client event payload must include `eventId`, `roomId`, `positionSeconds`, and `clientSentAt`.
- [ ] Step 18.4: `room.seek` must include target `positionSeconds`.
- [ ] Step 18.5: Rooms service must allow playback control only for `OWNER` and `CONTROLLER`.
- [ ] Step 18.6: Rooms service must reject playback control from `VIEWER`.
- [ ] Step 18.7: On play, store `playbackStatus = PLAYING`, current `positionSeconds`, current `updatedAt`, and increment `version`.
- [ ] Step 18.8: On pause, calculate current position from previous sync point, store `PAUSED`, store calculated position, set `updatedAt`, and increment `version`.
- [ ] Step 18.9: On seek, store target position, keep chosen playback status, set `updatedAt`, and increment `version`.
- [ ] Step 18.10: Publish playback update to Redis Pub/Sub channel `room:{roomId}:events`.
- [ ] Step 18.11: Every Rooms instance must subscribe only to room channels that have local sockets.
- [ ] Step 18.12: Every subscribed instance must broadcast updates to local sockets in that room.
- [ ] Step 18.13: Server payload must include `version`.
- [ ] Step 18.14: Web client must ignore playback events with version lower than the last applied version.
- [ ] Step 18.15: Add multi-instance local test with two Rooms service processes connected to same Redis.
- [ ] Step 18.16: Verify user A on instance 1 pauses and user B on instance 2 receives event.
- [ ] Step 18.17: Verify reconnect reads current Redis state and does not need Pub/Sub replay.
- [ ] Step 18.18: Commit playback synchronization.

```bash
git add apps/rooms-service apps/web tests
git commit -m "feat(rooms): implement playback synchronization"
```

## Phase 19 - Room Chat And Reactions

- [ ] Step 19.1: Define WebSocket chat events.

```text
chat.message
chat.message_created
chat.reaction
chat.reaction_created
```

- [ ] Step 19.2: Chat message request payload must be:

```json
{
  "messageId": "msg_abc123",
  "roomId": "room_123",
  "text": "Hello everyone"
}
```

- [ ] Step 19.3: Reject chat messages over 1000 characters.
- [ ] Step 19.4: Reject blank chat messages.
- [ ] Step 19.5: Accept chat messages only from current room participants.
- [ ] Step 19.6: Store chat messages in Redis list `room:{roomId}:messages`.
- [ ] Step 19.7: Apply 24-hour TTL to chat message key.
- [ ] Step 19.8: Store seen message IDs in Redis set `room:{roomId}:seenMessageIds`.
- [ ] Step 19.9: If the same `messageId` is received again from the same author, return the existing visible message effect without duplicating the message.
- [ ] Step 19.10: Publish chat message through Redis Pub/Sub.
- [ ] Step 19.11: Reaction payload must be:

```json
{
  "reactionId": "react_abc123",
  "roomId": "room_123",
  "emoji": "laugh"
}
```

- [ ] Step 19.12: Allowed reaction names: `like`, `laugh`, `wow`, `sad`, `fire`.
- [ ] Step 19.13: Publish reactions through Redis Pub/Sub.
- [ ] Step 19.14: Do not persist reactions beyond room TTL.
- [ ] Step 19.15: Build chat UI inside room page.
- [ ] Step 19.16: Build reaction buttons inside room page.
- [ ] Step 19.17: Add tests for message validation, duplicate message retry, TTL, reaction validation, and cross-instance chat delivery.
- [ ] Step 19.18: Commit chat/reactions.

```bash
git add apps/rooms-service apps/web tests
git commit -m "feat(rooms): add room chat and reactions"
```

## Phase 20 - Room Web Experience

- [ ] Step 20.1: Build create room UI on movie detail page.
- [ ] Step 20.2: Create options: solo watch, private room, public room.
- [ ] Step 20.3: Solo watch opens player without WebSocket room state.
- [ ] Step 20.4: Private room calls `POST /rooms` with `visibility = PRIVATE`.
- [ ] Step 20.5: Public room calls `POST /rooms` with `visibility = PUBLIC`.
- [ ] Step 20.6: Build public rooms list.
- [ ] Step 20.7: Build invite friend UI.
- [ ] Step 20.8: Build invite URL copy action.
- [ ] Step 20.9: Build participants list.
- [ ] Step 20.10: Build owner permission controls.
- [ ] Step 20.11: Integrate HTML5/HLS player with room playback state.
- [ ] Step 20.12: Owner/controller play button sends `room.play`.
- [ ] Step 20.13: Owner/controller pause button sends `room.pause`.
- [ ] Step 20.14: Owner/controller seek sends `room.seek`.
- [ ] Step 20.15: Viewer controls are disabled for room-wide playback.
- [ ] Step 20.16: On WebSocket reconnect, client waits for `room.state_sync` before applying local playback changes.
- [ ] Step 20.17: Show reconnecting banner while socket is disconnected.
- [ ] Step 20.18: Add E2E test with two browser contexts in one room.
- [ ] Step 20.19: Verify play, pause, seek, chat, reaction, reconnect, and viewer read-only behavior.
- [ ] Step 20.20: Commit room web experience.

```bash
git add apps/web tests
git commit -m "feat(web): add watch room experience"
```

## Phase 21 - Notifications Service

- [ ] Step 21.1: Create RabbitMQ exchanges.

```text
kinvue.domain direct
kinvue.notifications.dlx direct
```

- [ ] Step 21.2: Create queue `notifications.events`.
- [ ] Step 21.3: Bind routing keys `ROOM_INVITED`, `FRIEND_REQUEST_CREATED`, and `FRIEND_REQUEST_ACCEPTED`.
- [ ] Step 21.4: Configure retry behavior with two retries.
- [ ] Step 21.5: Route retry exhaustion to DLQ `notifications.events.dlq`.
- [ ] Step 21.6: Add Notifications PostgreSQL or SQLite local store for delivered in-app notifications.
- [ ] Step 21.7: Create `processed_notification_events` table keyed by `event_id`.
- [ ] Step 21.8: Create `notifications` table.

```text
notification_id uuid primary key
recipient_id uuid not null
type text not null
payload jsonb not null
read_at timestamptz null
created_at timestamptz not null
```

- [ ] Step 21.9: Consumer must ACK only after notification row is written or event is confirmed duplicate.
- [ ] Step 21.10: Consumer must NACK on transient provider/store failure.
- [ ] Step 21.11: Duplicate `eventId` must not create duplicate notification rows.
- [ ] Step 21.12: Implement `GET /notifications`.
- [ ] Step 21.13: Implement `POST /notifications/:notificationId/read`.
- [ ] Step 21.14: Add Gateway routes for notification reads.
- [ ] Step 21.15: Build notification bell in web app.
- [ ] Step 21.16: Add tests for ACK after success, retry on failure, DLQ after retry exhaustion, duplicate suppression, and notification read state.
- [ ] Step 21.17: Commit notifications.

```bash
git add apps/notifications-service apps/gateway apps/web infra packages
git commit -m "feat(notifications): implement at-least-once notification delivery"
```

## Phase 22 - Admin Media Upload

- [ ] Step 22.1: Add S3-compatible client to Movie Service.
- [ ] Step 22.2: Configure local MinIO endpoint from environment.
- [ ] Step 22.3: Implement `POST /admin/movies/:movieId/upload/init`.
- [ ] Step 22.4: Upload init request body must be:

```json
{
  "fileName": "movie.mp4",
  "contentType": "video/mp4",
  "fileSizeBytes": 21474836480,
  "partCount": 200
}
```

- [ ] Step 22.5: Validate content type is `video/mp4`, `video/quicktime`, or `video/x-matroska`.
- [ ] Step 22.6: Validate file size is greater than 1 MB and less than or equal to 25 GB.
- [ ] Step 22.7: Create movie upload record before returning presigned URLs.
- [ ] Step 22.8: Set movie status to `UPLOADING`.
- [ ] Step 22.9: Use object key pattern `movies/{movieId}/original/{uploadId}/{fileName}`.
- [ ] Step 22.10: Return S3 upload ID and presigned URLs for each part.
- [ ] Step 22.11: Implement `POST /admin/movies/:movieId/upload/complete`.
- [ ] Step 22.12: Complete request body must include upload ID and all uploaded part ETags.
- [ ] Step 22.13: Complete multipart upload in S3/MinIO.
- [ ] Step 22.14: Set movie status to `PROCESSING`.
- [ ] Step 22.15: Publish transcode job to RabbitMQ queue `media.transcode`.
- [ ] Step 22.16: Implement abandoned upload cleanup job.
- [ ] Step 22.17: Cleanup job marks uploads older than 24 hours as `ABANDONED`.
- [ ] Step 22.18: Cleanup job aborts multipart upload when storage API supports it.
- [ ] Step 22.19: Build admin upload UI.
- [ ] Step 22.20: Upload UI must upload parts directly to MinIO/S3, not through Gateway.
- [ ] Step 22.21: Upload UI must retry failed parts only.
- [ ] Step 22.22: Add tests for metadata-first behavior, presigned URL generation, complete upload, processing status, and abandoned cleanup.
- [ ] Step 22.23: Commit media upload.

```bash
git add apps/movie-service apps/web packages
git commit -m "feat(media): add direct multipart upload"
```

## Phase 23 - Transcoding Worker

- [ ] Step 23.1: Create RabbitMQ queue `media.transcode`.
- [ ] Step 23.2: Worker consumes one transcode job at a time locally.
- [ ] Step 23.3: Job payload must be:

```json
{
  "jobId": "job_123",
  "movieId": "movie_123",
  "originalKey": "movies/movie_123/original/upload_123/movie.mp4",
  "attempt": 1
}
```

- [ ] Step 23.4: Worker downloads original from MinIO/S3 to local temp directory.
- [ ] Step 23.5: Worker runs FFmpeg to create HLS master playlist.
- [ ] Step 23.6: Worker creates 1080p, 720p, and 480p renditions.
- [ ] Step 23.7: Worker writes outputs to `movies/{movieId}/hls/`.
- [ ] Step 23.8: Worker calls Movie Service internal endpoint `POST /internal/movies/:movieId/transcode-complete`.
- [ ] Step 23.9: Movie Service verifies HLS master key exists.
- [ ] Step 23.10: Movie Service sets movie status to `READY`.
- [ ] Step 23.11: If worker fails, retry job up to 3 attempts.
- [ ] Step 23.12: After third failure, call `POST /internal/movies/:movieId/transcode-failed`.
- [ ] Step 23.13: Movie Service sets status to `PROCESSING_FAILED`.
- [ ] Step 23.14: ACK RabbitMQ message only after success or durable failure state update.
- [ ] Step 23.15: Add tests with a short fixture video.
- [ ] Step 23.16: Verify generated HLS playlist can be opened by local player.
- [ ] Step 23.17: Commit transcoding.

```bash
git add apps/transcode-worker apps/movie-service tests/fixtures
git commit -m "feat(media): add hls transcoding worker"
```

## Phase 24 - Signed Media Playback

- [ ] Step 24.1: Implement `POST /movies/:movieId/media-access`.
- [ ] Step 24.2: Media access must require authenticated user.
- [ ] Step 24.3: Media access must reject movies not in `READY` or `PUBLISHED` state.
- [ ] Step 24.4: Media access must return signed URL for HLS master playlist.
- [ ] Step 24.5: Signed URL must expire in 10 minutes.
- [ ] Step 24.6: Web player must request media access before loading HLS.
- [ ] Step 24.7: Web player must load HLS from signed URL.
- [ ] Step 24.8: Application services must not stream segment bytes.
- [ ] Step 24.9: Verify direct unsigned MinIO object access is not accepted in local configuration when possible.
- [ ] Step 24.10: Add tests for unauthorized access, expired signed URL, unavailable movie state, and successful HLS playback.
- [ ] Step 24.11: Commit signed media playback.

```bash
git add apps/movie-service apps/web tests
git commit -m "feat(media): add signed playback access"
```

## Phase 25 - Scheduling Future Watch Rooms

- [ ] Step 25.1: Add scheduled room data model.
- [ ] Step 25.2: Store scheduled rooms in Movie PostgreSQL or a Rooms PostgreSQL store only for future durable scheduling; for this plan, create `scheduled_rooms` in Movie PostgreSQL because the schedule is tied to movie watch intent and must survive Redis loss.
- [ ] Step 25.3: Table fields:

```text
scheduled_room_id uuid primary key
owner_id uuid not null
movie_id uuid not null
visibility text not null
scheduled_for timestamptz not null
status text not null
created_at timestamptz not null
updated_at timestamptz not null
```

- [ ] Step 25.4: Allowed statuses: `SCHEDULED`, `OPENED`, `CANCELLED`.
- [ ] Step 25.5: Implement `POST /scheduled-rooms`.
- [ ] Step 25.6: Implement `GET /scheduled-rooms`.
- [ ] Step 25.7: Implement `POST /scheduled-rooms/:scheduledRoomId/cancel`.
- [ ] Step 25.8: Implement scheduler that creates Redis room when `scheduled_for` is due.
- [ ] Step 25.9: Scheduler must mark scheduled room as `OPENED` after Redis room creation succeeds.
- [ ] Step 25.10: Scheduler must emit room invitation events for invitees.
- [ ] Step 25.11: Build schedule watch form on movie detail page.
- [ ] Step 25.12: Build scheduled rooms page.
- [ ] Step 25.13: Add tests for create schedule, cancel schedule, due schedule opens room, and invitee notification.
- [ ] Step 25.14: Commit scheduled rooms.

```bash
git add apps/movie-service apps/rooms-service apps/web tests
git commit -m "feat(rooms): add scheduled watch sessions"
```

## Phase 26 - Observability

- [ ] Step 26.1: Ensure every service logs JSON.
- [ ] Step 26.2: Ensure every request has a request ID.
- [ ] Step 26.3: Add HTTP metrics to Gateway, Auth, Users, Movie, Rooms, and Notifications.
- [ ] Step 26.4: Add WebSocket metrics to Rooms.

```text
active_websockets
active_rooms
playback_commands_per_second
outgoing_room_events_per_second
reconnect_count
resync_latency_ms
redis_command_latency_ms
pubsub_latency_ms
```

- [ ] Step 26.5: Add Auth metrics.

```text
login_count
registration_count
registration_saga_state_count
registration_retry_count
registration_compensation_count
failed_login_count
```

- [ ] Step 26.6: Add Users metrics for profile reads, friendship operations, user search latency, and Mongo query latency.
- [ ] Step 26.7: Add Movie/Search metrics for search QPS, search p95/p99, indexing latency, reconciliation lag, stale index count, and Meilisearch failures.
- [ ] Step 26.8: Add RabbitMQ metrics for publish rate, consume rate, unacked count, queue depth, retry count, DLQ depth, and oldest message age.
- [ ] Step 26.9: Add Media metrics for upload throughput, multipart failures, abandoned upload count, transcode queue depth, transcode duration, failed transcodes, CDN hit ratio placeholder metric, and stream-start latency.
- [ ] Step 26.10: Create Prometheus scrape config.
- [ ] Step 26.11: Create Grafana dashboard `KinVue Overview`.
- [ ] Step 26.12: Create Grafana dashboard `KinVue Rooms`.
- [ ] Step 26.13: Create Grafana dashboard `KinVue Media`.
- [ ] Step 26.14: Create runbook `docs/runbooks/observability.md`.
- [ ] Step 26.15: Commit observability.

```bash
git add apps infra docs
git commit -m "feat: add observability metrics and dashboards"
```

## Phase 27 - Security Hardening

- [ ] Step 27.1: Enforce TLS in production deployment configuration.
- [ ] Step 27.2: Ensure Gateway validates JWT issuer, audience, expiration, signature, and scopes.
- [ ] Step 27.3: Ensure Rooms validates JWT during WebSocket handshake.
- [ ] Step 27.4: Ensure Rooms checks room access after JWT validation.
- [ ] Step 27.5: Ensure Rooms checks permissions before play, pause, seek, invite, close, and role changes.
- [ ] Step 27.6: Ensure Auth never logs passwords, password hashes, refresh tokens, or access tokens.
- [ ] Step 27.7: Ensure services never commit secrets.
- [ ] Step 27.8: Add secret scanning to CI.
- [ ] Step 27.9: Add dependency vulnerability scanning to CI.
- [ ] Step 27.10: Add input validation to every external endpoint.
- [ ] Step 27.11: Add request body size limits.
- [ ] Step 27.12: Add upload content type and size validation.
- [ ] Step 27.13: Add admin scope to all admin movie/media endpoints.
- [ ] Step 27.14: Add rate limits from Gateway plan.
- [ ] Step 27.15: Add CORS allowlist for web app origin.
- [ ] Step 27.16: Add security tests for direct private room join denial, viewer playback denial, admin endpoint user denial, expired JWT denial, invalid media access denial, and upload type denial.
- [ ] Step 27.17: Create runbook `docs/runbooks/security.md`.
- [ ] Step 27.18: Commit security hardening.

```bash
git add apps infra docs .github
git commit -m "chore: harden security controls"
```

## Phase 28 - CI Pipeline

- [ ] Step 28.1: Create `.github/workflows/ci.yml`.
- [ ] Step 28.2: CI must install Node 20.
- [ ] Step 28.3: CI must install pnpm.
- [ ] Step 28.4: CI must install dependencies with lockfile.
- [ ] Step 28.5: CI must run format check.
- [ ] Step 28.6: CI must run lint.
- [ ] Step 28.7: CI must run typecheck.
- [ ] Step 28.8: CI must run unit tests.
- [ ] Step 28.9: CI must start Docker Compose services for integration tests.
- [ ] Step 28.10: CI must run integration tests.
- [ ] Step 28.11: CI must run Playwright smoke tests.
- [ ] Step 28.12: CI must upload test artifacts on failure.
- [ ] Step 28.13: Add branch protection requiring CI success before merge.
- [ ] Step 28.14: Commit CI.

```bash
git add .github
git commit -m "ci: add validation pipeline"
```

## Phase 29 - End-to-End User Journeys

- [ ] Step 29.1: Create E2E test: register user.
- [ ] Step 29.2: Create E2E test: login user.
- [ ] Step 29.3: Create E2E test: edit profile.
- [ ] Step 29.4: Create E2E test: user search.
- [ ] Step 29.5: Create E2E test: friend request and accept.
- [ ] Step 29.6: Create E2E test: admin creates and publishes movie.
- [ ] Step 29.7: Create E2E test: user searches movie.
- [ ] Step 29.8: Create E2E test: user saves movie to watchlist.
- [ ] Step 29.9: Create E2E test: user starts solo watch.
- [ ] Step 29.10: Create E2E test: user creates private room.
- [ ] Step 29.11: Create E2E test: invited friend joins private room.
- [ ] Step 29.12: Create E2E test: public user joins public room.
- [ ] Step 29.13: Create E2E test: owner grants controller permission.
- [ ] Step 29.14: Create E2E test: controller play/pause/seek syncs to viewer.
- [ ] Step 29.15: Create E2E test: viewer cannot control playback.
- [ ] Step 29.16: Create E2E test: chat message appears for all participants.
- [ ] Step 29.17: Create E2E test: reaction appears for all participants.
- [ ] Step 29.18: Create E2E test: reconnect resyncs current playback state.
- [ ] Step 29.19: Create E2E test: notification appears for friend request and room invite.
- [ ] Step 29.20: Create E2E test: admin upload with small fixture video creates playable HLS.
- [ ] Step 29.21: Run all E2E tests locally.
- [ ] Step 29.22: Commit E2E journeys.

```bash
git add tests apps
git commit -m "test: add end-to-end user journeys"
```

## Phase 30 - Reliability And Failure Tests

- [ ] Step 30.1: Test Gateway instance restart while services stay running.
- [ ] Step 30.2: Verify no business state is lost when Gateway restarts.
- [ ] Step 30.3: Test Auth service restart during normal authenticated API usage.
- [ ] Step 30.4: Verify existing valid JWTs still work through Gateway after Auth restart.
- [ ] Step 30.5: Test Users unavailable during registration.
- [ ] Step 30.6: Verify registration does not return success until profile exists.
- [ ] Step 30.7: Test duplicate registration request.
- [ ] Step 30.8: Verify unique email constraint prevents race duplicates.
- [ ] Step 30.9: Test Rooms instance kill while two clients are connected.
- [ ] Step 30.10: Verify clients reconnect and receive `room.state_sync`.
- [ ] Step 30.11: Test Redis restart in local development.
- [ ] Step 30.12: Verify active room state loss is documented as acceptable in local single Redis and Redis HA is required for production.
- [ ] Step 30.13: Test Pub/Sub interruption.
- [ ] Step 30.14: Verify reconnect reads current state instead of replaying event history.
- [ ] Step 30.15: Test Meilisearch unavailable during publish.
- [ ] Step 30.16: Verify PostgreSQL movie status remains correct and reconciliation repairs index later.
- [ ] Step 30.17: Test RabbitMQ unavailable during outbox publish.
- [ ] Step 30.18: Verify outbox event remains pending.
- [ ] Step 30.19: Test notification consumer crash before ACK.
- [ ] Step 30.20: Verify RabbitMQ redelivers message.
- [ ] Step 30.21: Test duplicate notification event.
- [ ] Step 30.22: Verify duplicate visible notification is suppressed.
- [ ] Step 30.23: Test transcode worker crash.
- [ ] Step 30.24: Verify job is retried and movie remains in processing or failure state.
- [ ] Step 30.25: Test interrupted multipart upload.
- [ ] Step 30.26: Verify failed part retry does not restart entire upload.
- [ ] Step 30.27: Commit reliability tests.

```bash
git add tests docs
git commit -m "test: add failure and recovery coverage"
```

## Phase 31 - Load And Capacity Validation

- [ ] Step 31.1: Create `tests/load/gateway-authenticated-api.js`.
- [ ] Step 31.2: Measure Gateway RPS, p50, p95, p99, CPU, memory, event loop lag, JWT validation latency, and error rate.
- [ ] Step 31.3: Create `tests/load/movie-search.js`.
- [ ] Step 31.4: Target search baseline: 3.6k QPS average model and 7k-11k peak model.
- [ ] Step 31.5: Record Meilisearch CPU, RAM, p95, p99, and response size.
- [ ] Step 31.6: Create `tests/load/rooms-websocket.js`.
- [ ] Step 31.7: Start with 1k sockets locally.
- [ ] Step 31.8: Increase to 5k sockets in a larger environment.
- [ ] Step 31.9: Validate playback event propagation latency under 200 ms.
- [ ] Step 31.10: Validate chat delivery latency under 500 ms.
- [ ] Step 31.11: Create `tests/load/chat.js`.
- [ ] Step 31.12: Target chat model: 667 incoming messages/sec and 2.7k outgoing deliveries/sec in scaled test environment.
- [ ] Step 31.13: Create `tests/load/rabbitmq-notifications.js`.
- [ ] Step 31.14: Validate retry x2 and DLQ behavior under provider failures.
- [ ] Step 31.15: Create `tests/load/media-upload-transcode.js`.
- [ ] Step 31.16: Validate queue depth, transcode time, and worker scaling behavior.
- [ ] Step 31.17: Record every test result in `docs/runbooks/capacity-results.md`.
- [ ] Step 31.18: Do not add horizontal Meilisearch topology unless search NFR is missed after vertical scaling.
- [ ] Step 31.19: Do not add Redis search cache unless metrics show a useful hit rate.
- [ ] Step 31.20: Commit load tests and first capacity notes.

```bash
git add tests/load docs/runbooks
git commit -m "test: add load validation scripts"
```

## Phase 32 - MVP Deployment

- [ ] Step 32.1: Create production Dockerfiles for all apps.
- [ ] Step 32.2: Create deployment environment variable documentation.
- [ ] Step 32.3: Choose deployment target that can keep MVP near <= $300/month.
- [ ] Step 32.4: Provision PostgreSQL for Auth.
- [ ] Step 32.5: Provision PostgreSQL for Movie.
- [ ] Step 32.6: Provision MongoDB for Users.
- [ ] Step 32.7: Provision Redis with HA-compatible production plan.
- [ ] Step 32.8: Provision RabbitMQ or managed AMQP.
- [ ] Step 32.9: Provision object storage bucket.
- [ ] Step 32.10: Provision CDN in front of object storage.
- [ ] Step 32.11: Deploy Gateway behind HTTPS.
- [ ] Step 32.12: Deploy Auth, Users, Movie, Rooms, and Notifications on private network where possible.
- [ ] Step 32.13: Expose Rooms WebSocket endpoint over `wss`.
- [ ] Step 32.14: Configure CDN signed media access.
- [ ] Step 32.15: Configure CORS for production web origin.
- [ ] Step 32.16: Configure secrets through deployment platform secret manager.
- [ ] Step 32.17: Run database migrations.
- [ ] Step 32.18: Run Meilisearch index setup.
- [ ] Step 32.19: Run smoke test against deployed Gateway.
- [ ] Step 32.20: Run smoke test against deployed Rooms WebSocket.
- [ ] Step 32.21: Run smoke test for signed media playback.
- [ ] Step 32.22: Create `docs/runbooks/deployment.md`.
- [ ] Step 32.23: Commit deployment docs.

```bash
git add infra docs
git commit -m "docs: add mvp deployment runbook"
```

## Phase 33 - Documentation Refresh

- [ ] Step 33.1: Update `00_README.md` to point to this implementation plan.
- [ ] Step 33.2: Update `19_IMPLEMENTATION_PLAN.md` to say the expanded plan lives in `27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md`.
- [ ] Step 33.3: Update `18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md` with implementation decisions fixed by this plan.
- [ ] Step 33.4: Update `23_DATA_MODELS_DRAFT.md` if final field names differ from this plan.
- [ ] Step 33.5: Update `16_ARCHITECTURE_DECISIONS.md` only if implementation evidence changes architecture.
- [ ] Step 33.6: Update `17_DECISION_LOG.md` with newly accepted implementation-level choices.
- [ ] Step 33.7: Update `20_TESTING_AND_VALIDATION_PLAN.md` with real test commands and results.
- [ ] Step 33.8: Update `21_OBSERVABILITY_AND_METRICS.md` with final dashboard names and metric labels.
- [ ] Step 33.9: Update `22_SECURITY_MODEL.md` with final token, JWKS, upload, and admin authorization details.
- [ ] Step 33.10: Commit documentation refresh.

```bash
git add *.md docs
git commit -m "docs: refresh implementation details"
```

## Phase 34 - Final Acceptance Checklist

- [ ] Step 34.1: Run full local infrastructure.

```bash
pnpm infra:up
```

- [ ] Step 34.2: Run all services.

```bash
pnpm dev
```

- [ ] Step 34.3: Run format check.
- [ ] Step 34.4: Run lint.
- [ ] Step 34.5: Run typecheck.
- [ ] Step 34.6: Run unit tests.
- [ ] Step 34.7: Run integration tests.
- [ ] Step 34.8: Run E2E tests.
- [ ] Step 34.9: Run selected load smoke tests.
- [ ] Step 34.10: Verify register, login, refresh, logout.
- [ ] Step 34.11: Verify profile view and edit.
- [ ] Step 34.12: Verify user search.
- [ ] Step 34.13: Verify friend request, accept, reject, friends list.
- [ ] Step 34.14: Verify admin movie create, edit, publish, schedule.
- [ ] Step 34.15: Verify movie search and detail.
- [ ] Step 34.16: Verify watchlist add and remove.
- [ ] Step 34.17: Verify solo playback.
- [ ] Step 34.18: Verify private room creation and invited join.
- [ ] Step 34.19: Verify public room creation and public join.
- [ ] Step 34.20: Verify owner can close room.
- [ ] Step 34.21: Verify owner can grant controller.
- [ ] Step 34.22: Verify controller can play, pause, and seek.
- [ ] Step 34.23: Verify viewer cannot control playback.
- [ ] Step 34.24: Verify playback sync across two browser sessions.
- [ ] Step 34.25: Verify reconnect resync.
- [ ] Step 34.26: Verify chat message delivery.
- [ ] Step 34.27: Verify chat duplicate `messageId` does not duplicate visible messages.
- [ ] Step 34.28: Verify reactions.
- [ ] Step 34.29: Verify notifications.
- [ ] Step 34.30: Verify multipart upload with a small fixture.
- [ ] Step 34.31: Verify transcode output.
- [ ] Step 34.32: Verify signed HLS playback.
- [ ] Step 34.33: Verify application services do not serve media bytes.
- [ ] Step 34.34: Verify metrics endpoints.
- [ ] Step 34.35: Verify Grafana dashboards.
- [ ] Step 34.36: Verify logs include request IDs.
- [ ] Step 34.37: Verify no secrets are committed.
- [ ] Step 34.38: Verify CI passes.
- [ ] Step 34.39: Create release tag.

```bash
git tag v0.1.0-mvp
git push origin main --tags
```

## Requirement Coverage Map

- FR-01 through FR-04 are covered by Phases 8, 10, 11, and 12.
- FR-05 through FR-09 are covered by Phases 9 and 13.
- FR-10 through FR-15 are covered by Phases 14, 15, 22, and 23.
- FR-16 through FR-21 are covered by Phases 18, 20, and 24.
- FR-22 through FR-31 are covered by Phases 16, 17, 18, and 20.
- FR-32 through FR-35 are covered by Phases 17, 18, 19, and 20.
- FR-36 through FR-37 are covered by Phase 25.
- NFR-01 through NFR-02 are addressed by the service separation, Redis-backed Rooms design, and load tests in Phase 31.
- NFR-03 through NFR-07 are addressed by metrics, load tests, WebSocket design, search design, and playback state sync.
- NFR-08 through NFR-10 are addressed by Meilisearch projection, reconciliation, and last-processed-wins room state.
- NFR-11 is addressed by metadata-first upload, multipart upload, object storage, and upload/transcode state tracking.
- NFR-12 is addressed by RabbitMQ manual ACK, retry, DLQ, and Transactional Outbox.
- NFR-13 through NFR-14 are addressed by ephemeral Redis chat with TTL and the explicit future extraction rule.
- NFR-15 is addressed by MVP deployment constraints and avoiding target-scale overprovisioning.

## Commit Rhythm

- Commit after every phase.
- Keep each commit buildable.
- Never mix unrelated phases in one commit.
- If a phase fails, fix that phase before moving forward.
- If implementation evidence contradicts an architecture decision, update the relevant ADR and decision log in the same branch.

## Stop Conditions

Stop and revisit architecture only when one of these happens:

- A requirement cannot be implemented without changing a service boundary.
- Load tests show an NFR miss after reasonable local optimization.
- A failure test shows user-visible data loss for data that the docs classify as durable.
- A security test shows unauthorized access to private rooms, admin APIs, credentials, media uploads, or media playback.
- Monthly MVP cost exceeds the <= $300 target before optional scale features are added.

## What Not To Build In v1

- Do not build a separate Chat Service.
- Do not build a separate Streaming Service.
- Do not add Kafka.
- Do not add 2PC.
- Do not add graph database support.
- Do not add durable chat history.
- Do not add global DMs.
- Do not add movie recommendations.
- Do not add DRM.
- Do not add multi-CDN.
- Do not add horizontal Meilisearch topology before benchmark evidence.
- Do not add Redis search-result cache before production metrics show useful hit rate.

## Final Definition Of Done

KinVue MVP is done when a user can register, log in, edit a profile, find another user, become friends, search published movies, save movies, watch solo, create private and public rooms, invite friends, synchronize playback, chat, react, receive notifications, and play admin-uploaded/transcoded media through signed media access, with CI passing, local E2E tests passing, core failure tests passing, and observability available for every service.
