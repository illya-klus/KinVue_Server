# Epics and features

Epics follow the implementation plan's service order. Features are the slices inside them. Tickets are in `tickets.md`.

## E-00 — Decision gates

Close the behavior-shaping choices that the architecture pack leaves open and that the implementation plan proposes without updating the decision log.

- Stage: Stage 0 — Discovery and architecture
- Tickets: 25
- Estimated effort: 33 hours
- MVP tickets: 25

### F-00-01 — Stack, layout, and ports

Record whether the implementation plan's stack and repository layout are accepted.

- Tickets: 1

### F-00-02 — Auth and registration policy

Record token, hashing, and registration compensation choices that the architecture pack still lists as deferred.

- Tickets: 5

### F-00-03 — Users and social policy

Record username, search, and watchlist ownership choices.

- Tickets: 3

### F-00-04 — Rooms, presence, and playback policy

Record TTLs, heartbeat, permissions, and the durable-event store for a service that otherwise has no database.

- Tickets: 5

### F-00-05 — Movie, search, and media policy

Record the movie state machine, search access, reconciliation cadence, and media pipeline choices.

- Tickets: 5

### F-00-06 — Notifications, admin, and invite policy

Record how admin authority is granted, how invite URLs work, and what v1 notifications actually deliver.

- Tickets: 3

### F-00-07 — Deployment and explicit non-goals

Record the MVP hosting class and the capabilities that v1 must not build.

- Tickets: 3

## E-01 — Workstation and repository bootstrap

Prepare a local toolchain and repository hygiene so application work can start.

- Stage: Stage 1 — Foundation
- Tickets: 5
- Estimated effort: 5 hours
- MVP tickets: 5

### F-01-01 — Local toolchain

Install the tools named by the implementation plan.

- Tickets: 4

### F-01-02 — Repository hygiene

Ignore secrets and build output before application code starts.

- Tickets: 1

## E-02 — Monorepo foundation

Create the TypeScript workspace layout fixed by the implementation plan.

- Stage: Stage 1 — Foundation
- Tickets: 6
- Estimated effort: 11 hours
- MVP tickets: 6

### F-02-01 — Workspace and task runner

Create the pnpm workspace and Turborepo task graph.

- Tickets: 3

### F-02-02 — TypeScript, format, and lint

Share strict TypeScript and formatting, and select a linter because the plan requires lint without naming one.

- Tickets: 3

## E-03 — Local infrastructure

Run Auth PostgreSQL, Movie PostgreSQL, Users MongoDB, Redis, RabbitMQ, Meilisearch, MinIO, Prometheus, and Grafana locally.

- Stage: Stage 1 — Foundation
- Tickets: 11
- Estimated effort: 22 hours
- MVP tickets: 11

### F-03-01 — Relational and document stores

Run the two PostgreSQL databases and Users MongoDB.

- Tickets: 4

### F-03-02 — Redis, RabbitMQ, and Meilisearch

Run the realtime, notification, and search dependencies.

- Tickets: 3

### F-03-03 — Object storage

Run MinIO and create the media bucket.

- Tickets: 1

### F-03-04 — Metrics stack and environment contract

Run Prometheus and Grafana and publish the local environment contract.

- Tickets: 3

## E-04 — Shared packages

Provide config, logging, errors, JWT verification, contracts, and test helpers used by every service.

- Stage: Stage 1 — Foundation
- Tickets: 7
- Estimated effort: 22 hours
- MVP tickets: 7

### F-04-01 — Configuration

Fail startup when required environment variables are missing.

- Tickets: 1

### F-04-02 — Logging

Emit structured JSON logs with the required correlation fields.

- Tickets: 1

### F-04-03 — Errors

Use one error code set and HTTP mapping.

- Tickets: 1

### F-04-04 — JWT verification

Verify RS256 access tokens locally from JWKS.

- Tickets: 1

### F-04-05 — Shared contracts

Share DTOs and domain event names across services.

- Tickets: 1

### F-04-06 — Test helpers

Share database, Redis, and HTTP test utilities.

- Tickets: 2

## E-05 — Service skeletons

Boot every application with health, readiness, metrics, shared errors, and a container image.

- Stage: Stage 1 — Foundation
- Tickets: 22
- Estimated effort: 51 hours
- MVP tickets: 22

### F-05-01 — HTTP service skeletons

Boot Gateway, Auth, Users, Movie, Rooms HTTP, and Notifications.

- Tickets: 12

### F-05-02 — Realtime and worker skeletons

Boot the Rooms WebSocket port and the transcode worker.

- Tickets: 2

### F-05-03 — Container integration

Build images and run the service processes with local infrastructure.

- Tickets: 8

## E-06 — Auth data model

Persist identity, refresh sessions, and a future Auth outbox in Auth PostgreSQL.

- Stage: Stage 2 — Core backend
- Tickets: 5
- Estimated effort: 9 hours
- MVP tickets: 5

### F-06-01 — Identity schema

Store credentials and registration status with a unique email.

- Tickets: 2

### F-06-02 — Session and outbox schema

Store refresh sessions and an Auth outbox table for later durable Auth events.

- Tickets: 3

## E-07 — Auth token lifecycle

Implement password hashing, RS256 signing, login, refresh rotation, and logout.

- Stage: Stage 2 — Core backend
- Tickets: 9
- Estimated effort: 22 hours
- MVP tickets: 9

### F-07-01 — Password hashing and signing keys

Hash passwords and publish the public verification key.

- Tickets: 2

### F-07-02 — Login

Issue access and refresh tokens to ACTIVE identities.

- Tickets: 4

### F-07-03 — Refresh and logout

Rotate refresh tokens and revoke the current session.

- Tickets: 3

## E-08 — Registration saga

Register a user only when an ACTIVE Auth identity and a Users profile both exist.

- Stage: Stage 2 — Core backend
- Tickets: 7
- Estimated effort: 19 hours
- MVP tickets: 7

### F-08-01 — Registration success path

Create the global user id, identity, and profile before returning success.

- Tickets: 4

### F-08-02 — Registration failure path

Retry idempotently and compensate without reporting a false success.

- Tickets: 3

## E-09 — Users data model

Persist profiles and canonical friendships in MongoDB.

- Stage: Stage 2 — Core backend
- Tickets: 4
- Estimated effort: 10 hours
- MVP tickets: 4

### F-09-01 — Profile schema

Store the user profile document and username uniqueness.

- Tickets: 2

### F-09-02 — Friendship schema

Store one canonical friendship document per pair.

- Tickets: 2

## E-10 — Profiles and user search

Create idempotent profiles and let a user read, edit, and find people.

- Stage: Stage 2 — Core backend
- Tickets: 4
- Estimated effort: 11 hours
- MVP tickets: 4

### F-10-01 — Internal profile creation

Create a profile idempotently for the registration saga.

- Tickets: 1

### F-10-02 — Profile read and update

Let the signed-in user view and edit profile fields.

- Tickets: 2

### F-10-03 — User search

Find users by username or display name.

- Tickets: 1

## E-11 — Friendships

Send, list, accept, and reject friend requests, and record durable friendship events.

- Stage: Stage 2 — Core backend
- Tickets: 8
- Estimated effort: 20 hours
- MVP tickets: 8

### F-11-01 — Friend request lifecycle

Create, list, accept, and reject friend requests.

- Tickets: 5

### F-11-02 — Friendship events

Durably record friend-request events and publish them to RabbitMQ.

- Tickets: 3

## E-12 — API gateway

Route HTTP traffic, validate JWTs locally, enforce admin scope and rate limits, and forward request context.

- Stage: Stage 2 — Core backend
- Tickets: 10
- Estimated effort: 26 hours
- MVP tickets: 10

### F-12-01 — Edge middleware

Assign request ids, validate JWTs from a cached JWKS, and forward trusted context.

- Tickets: 3

### F-12-02 — Public routing

Proxy the unauthenticated routes named by the implementation plan.

- Tickets: 2

### F-12-03 — Authenticated routing

Proxy signed-in user routes without calling Auth on every request.

- Tickets: 2

### F-12-04 — Admin routing and rate limits

Guard admin routes and apply the documented rate limits.

- Tickets: 3

## E-13 — Web application shell

Create the React client shell, session handling, and route guards.

- Stage: Stage 3 — Frontend
- Tickets: 8
- Estimated effort: 19 hours
- MVP tickets: 8

### F-13-01 — Application shell

Create the client routes and shared screen states.

- Tickets: 4

### F-13-02 — Session client

Call only the Gateway for HTTP and recover from an expired access token.

- Tickets: 4

## E-14 — Registration and login UI

Let a person register, log in, and land on movie search.

- Stage: Stage 3 — Frontend
- Tickets: 3
- Estimated effort: 8 hours
- MVP tickets: 3

### F-14-01 — Register screen

Collect registration fields and surface duplicate-account errors.

- Tickets: 2

### F-14-02 — Login screen

Log in and redirect to movie search.

- Tickets: 1

## E-15 — Profile and social UI

Let a person edit a profile, find users, and manage friendships.

- Stage: Stage 3 — Frontend
- Tickets: 4
- Estimated effort: 11 hours
- MVP tickets: 4

### F-15-01 — Profile screens

Show and edit the signed-in profile.

- Tickets: 1

### F-15-02 — Friends screens

Search people and manage friend requests.

- Tickets: 3

## E-16 — Movie data model

Persist catalog, upload, watchlist, sync checkpoint, and movie outbox rows.

- Stage: Stage 2 — Core backend
- Tickets: 5
- Estimated effort: 10 hours
- MVP tickets: 5

### F-16-01 — Catalog schema

Store movie metadata and the accepted status values.

- Tickets: 2

### F-16-02 — Upload, watchlist, and sync schema

Store upload sessions, watchlist rows, the search checkpoint, and a movie outbox.

- Tickets: 3

## E-17 — Movie catalog API

Let an admin create, edit, publish, and schedule movies, and let clients read published movies.

- Stage: Stage 2 — Core backend
- Tickets: 8
- Estimated effort: 19 hours
- MVP tickets: 8

### F-17-01 — Admin movie metadata API

Create and edit draft movies.

- Tickets: 4

### F-17-02 — Publish and schedule API

Publish immediately or at a future time.

- Tickets: 3

### F-17-03 — Public movie read API

Read one published movie and search published movies.

- Tickets: 1

## E-18 — Search projection

Index published movies in Meilisearch and repair the index by reconciliation.

- Stage: Stage 2 — Core backend
- Tickets: 6
- Estimated effort: 18 hours
- MVP tickets: 6

### F-18-01 — Meilisearch projection

Configure the movies index and upsert on publish.

- Tickets: 3

### F-18-02 — Reconciliation and rebuild

Repair missed index updates and support a full rebuild.

- Tickets: 3

## E-19 — Watchlist

Let a user save and remove movies.

- Stage: Stage 2 — Core backend
- Tickets: 3
- Estimated effort: 5 hours
- MVP tickets: 3

### F-19-01 — Watchlist API

Add, remove, and list saved movies for the signed-in user.

- Tickets: 3

## E-20 — Movie web experience

Provide admin catalog screens, debounced search, movie detail, and watchlist screens.

- Stage: Stage 3 — Frontend
- Tickets: 5
- Estimated effort: 14 hours
- MVP tickets: 5

### F-20-01 — Admin movie screens

Create, edit, publish, and schedule movies in the web app.

- Tickets: 2

### F-20-02 — Search, detail, and watchlist screens

Search, open, and save movies.

- Tickets: 3

## E-21 — Rooms control API

Create, list, invite, authorize, and close ephemeral rooms in Redis.

- Stage: Stage 2 — Core backend
- Tickets: 10
- Estimated effort: 27 hours
- MVP tickets: 10

### F-21-01 — Room state store

Define Redis room, member, message, and event keys.

- Tickets: 1

### F-21-02 — Room lifecycle API

Create, list, and close rooms.

- Tickets: 3

### F-21-03 — Invites and permissions

Invite participants and grant playback control.

- Tickets: 6

## E-22 — Rooms realtime session

Accept authenticated WebSocket joins and maintain presence.

- Stage: Stage 2 — Core backend
- Tickets: 5
- Estimated effort: 16 hours
- MVP tickets: 5

### F-22-01 — WebSocket handshake and access

Authenticate the socket and enforce public or private access.

- Tickets: 3

### F-22-02 — Presence and heartbeat

Track online, disconnected, and left participants.

- Tickets: 2

## E-23 — Playback synchronization

Synchronize play, pause, and seek across Rooms instances from Redis state.

- Stage: Stage 2 — Core backend
- Tickets: 4
- Estimated effort: 14 hours
- MVP tickets: 4

### F-23-01 — Playback commands

Apply authorized play, pause, and seek to the Redis sync point.

- Tickets: 2

### F-23-02 — Cross-instance fan-out

Publish playback to other Rooms instances and resync from current state.

- Tickets: 2

## E-24 — Room chat and reactions

Deliver ephemeral room chat and reactions on the same WebSocket.

- Stage: Stage 2 — Core backend
- Tickets: 3
- Estimated effort: 9 hours
- MVP tickets: 3

### F-24-01 — Ephemeral chat

Store and broadcast room chat with idempotent retries.

- Tickets: 1

### F-24-02 — Reactions

Broadcast the allowed reaction set without a separate chat service.

- Tickets: 2

## E-25 — Room web experience

Let a person watch solo or in a room, invite others, and follow synchronized playback.

- Stage: Stage 3 — Frontend
- Tickets: 6
- Estimated effort: 18 hours
- MVP tickets: 6

### F-25-01 — Room creation and lobby

Start solo, private, and public watches and invite friends.

- Tickets: 3

### F-25-02 — Watch room player and controls

Bind the player to room state and disable viewer control.

- Tickets: 3

## E-26 — Notifications

Consume durable domain events at least once and show in-app notifications.

- Stage: Stage 4 — Integrations
- Tickets: 8
- Estimated effort: 22 hours
- MVP tickets: 8

### F-26-01 — Broker topology and consumer

Deliver notification events with manual acknowledgement, two retries, and a dead-letter queue.

- Tickets: 4

### F-26-02 — In-app notification API

Store and read in-app notifications with event deduplication.

- Tickets: 3

### F-26-03 — Notification UI

Show notifications in the web shell.

- Tickets: 1

## E-27 — Direct media upload

Authorize resumable direct-to-object-storage uploads without proxying bytes through the API.

- Stage: Stage 4 — Integrations
- Tickets: 6
- Estimated effort: 19 hours
- MVP tickets: 6

### F-27-01 — Upload authorization

Create metadata and presigned multipart URLs before bytes move.

- Tickets: 2

### F-27-02 — Upload completion and cleanup

Complete an upload into processing and abandon stale uploads.

- Tickets: 3

### F-27-03 — Admin upload UI

Upload parts directly to object storage and retry only failed parts.

- Tickets: 1

## E-28 — Transcoding

Turn completed uploads into HLS renditions and record READY or PROCESSING_FAILED.

- Stage: Stage 4 — Integrations
- Tickets: 5
- Estimated effort: 15 hours
- MVP tickets: 5

### F-28-01 — Transcode job processing

Generate the v1 HLS ladder from the original object.

- Tickets: 3

### F-28-02 — Movie processing callbacks

Move a movie to READY or PROCESSING_FAILED only after a durable worker result.

- Tickets: 2

## E-29 — Signed media playback

Authorize short-lived media access and play HLS from CDN or MinIO, not from application servers.

- Stage: Stage 4 — Integrations
- Tickets: 3
- Estimated effort: 8 hours
- MVP tickets: 3

### F-29-01 — Media access API

Return a short-lived signed playlist URL for playable movies.

- Tickets: 1

### F-29-02 — Player media loading

Load HLS from the signed URL without proxying segments through the API.

- Tickets: 2

## E-30 — Scheduled watch sessions

Schedule a future room for a movie and invitees, then open it when due.

- Stage: Stage 4 — Integrations
- Tickets: 5
- Estimated effort: 16 hours
- MVP tickets: 5

### F-30-01 — Schedule persistence

Store a future watch, its movie, and its invitees durably.

- Tickets: 2

### F-30-02 — Schedule opener

Open a Redis room when the schedule is due and notify invitees.

- Tickets: 2

### F-30-03 — Schedule UI

Create and review scheduled watches from the web app.

- Tickets: 1

## E-31 — Observability

Expose the metrics required to make scaling decisions and dashboard the core workloads.

- Stage: Stage 5 — Quality and hardening
- Tickets: 12
- Estimated effort: 32 hours
- MVP tickets: 12

### F-31-01 — Service metrics

Expose the workload metrics named in the observability document.

- Tickets: 7

### F-31-02 — Dashboards and runbook

Chart overview, rooms, and media, and explain how to read them.

- Tickets: 5

## E-32 — Security hardening

Enforce the v1 security model on every public ingress.

- Stage: Stage 5 — Quality and hardening
- Tickets: 7
- Estimated effort: 18 hours
- MVP tickets: 7

### F-32-01 — Transport and input protection

Terminate TLS, restrict browser origins, limit body size, and keep internal routes private.

- Tickets: 3

### F-32-02 — Authorization regression tests

Prove private rooms, viewer control, admin routes, and media access stay denied when they should.

- Tickets: 1

### F-32-03 — Security operations

Scan secrets and dependencies, and write the security runbook.

- Tickets: 3

## E-33 — CI pipeline

Run format, lint, typecheck, unit, integration, and browser smoke checks on every change.

- Stage: Stage 6 — Deployment
- Tickets: 3
- Estimated effort: 10 hours
- MVP tickets: 3

### F-33-01 — Pull-request validation

Run install, format, lint, typecheck, and unit tests in CI.

- Tickets: 1

### F-33-02 — Integration and browser CI

Run service integration tests and the Playwright smoke test.

- Tickets: 2

## E-34 — End-to-end journeys

Automate the documented user journeys from registration through signed playback.

- Stage: Stage 5 — Quality and hardening
- Tickets: 21
- Estimated effort: 62 hours
- MVP tickets: 21

### F-34-01 — Identity and social journeys

Cover registration, login, profile, search, and friendship end to end.

- Tickets: 5

### F-34-02 — Catalog journeys

Cover publish, search, and watchlist end to end.

- Tickets: 3

### F-34-03 — Room and media journeys

Cover rooms, realtime, notifications, upload, and signed playback end to end.

- Tickets: 13

## E-35 — Failure and recovery tests

Prove the failure behavior already chosen in the architecture pack.

- Stage: Stage 5 — Quality and hardening
- Tickets: 12
- Estimated effort: 36 hours
- MVP tickets: 12

### F-35-01 — Process failure tests

Restart Gateway, Auth, Users, and Rooms and confirm the documented recovery.

- Tickets: 5

### F-35-02 — Dependency failure tests

Exercise Redis, Meilisearch, RabbitMQ, notification acknowledgement, and transcode failure.

- Tickets: 7

## E-36 — Load and capacity validation

Measure the documented workloads and record results before any extra scaling topology.

- Stage: Stage 5 — Quality and hardening
- Tickets: 6
- Estimated effort: 19 hours
- MVP tickets: 5

### F-36-01 — API and search load

Measure Gateway and search before adding search topology.

- Tickets: 2

### F-36-02 — Realtime, notification, and media load

Measure rooms, chat, notifications, and transcode queue behavior.

- Tickets: 4

## E-37 — MVP deployment and operations

Deploy a budget-constrained environment that preserves the target architecture's boundaries.

- Stage: Stage 6 — Deployment
- Tickets: 14
- Estimated effort: 42 hours
- MVP tickets: 14

### F-37-01 — Production packaging

Produce deployable images and an environment variable contract.

- Tickets: 1

### F-37-02 — Environment provisioning

Provision MVP dependencies inside the budget target without provisioning 100k capacity.

- Tickets: 8

### F-37-03 — Release smoke and operations

Smoke-test the deployed paths and write deployment, backup, and rollback notes.

- Tickets: 5

## E-38 — Documentation refresh and release acceptance

Align the design pack with what shipped and complete the MVP acceptance checklist.

- Stage: Stage 7 — Production readiness
- Tickets: 13
- Estimated effort: 27 hours
- MVP tickets: 13

### F-38-01 — Documentation alignment

Update the design pack only where implementation evidence changed it.

- Tickets: 9

### F-38-02 — MVP acceptance

Run the final checklist and tag the MVP only after it passes.

- Tickets: 4
