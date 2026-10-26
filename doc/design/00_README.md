# KinVue Documentation Pack — v1

> Repo layout: this pack lives in `doc/design/`. The build plan is `doc/plan/27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md`. The ticket breakdown is `doc/backlog/`. Agent rules are `doc/AGENT.md`.

This package captures the current product, requirements, capacity estimates, architecture decisions, distributed-systems reasoning, data ownership rules, failure/reliability choices, and implementation planning discussed during the KinVue system-design sessions.

## Current stage

KinVue is currently at:

- Product idea: defined
- Functional requirements: v1
- Non-functional requirements: v1
- Capacity estimation: v1
- High-level architecture (HLA/HLD): v1
- Service boundaries: v1
- Core reliability patterns: selected
- Detailed design / implementation: next stage

The main architecture is intentionally not over-engineered. Decisions that need real metrics, implementation feedback, or load testing are explicitly deferred.

## Core system idea

KinVue is a watch-together platform:

- users can register, log in, maintain profiles and friendships;
- users can search for movies and save them;
- users can watch solo or in private/public rooms;
- rooms provide synchronized playback;
- room participants can chat and react in real time;
- users can invite friends and schedule future watch sessions;
- admins can upload/publish movies;
- video delivery is separated from API/realtime traffic.

## Core architecture principles

1. **Gateway is not the only door into the system.**
   - HTTP/API traffic -> Gateway cluster.
   - Realtime WebSocket traffic -> Rooms cluster directly.
   - Media traffic -> CDN directly.

2. **Application servers do not proxy video bytes.**

3. **Room state is ephemeral and latency-sensitive.**
   - Redis is the shared room-state store.
   - Redis Pub/Sub propagates events between Rooms instances.

4. **JWT is validated locally.**
   - Gateway validates API traffic.
   - Rooms validates WebSocket handshakes.
   - Auth does not receive a request for every authenticated operation.

5. **PostgreSQL is the movie source of truth.**
   - Meilisearch is a rebuildable search projection.

6. **Users Service owns user profile/social data.**
   - Auth owns credentials/identity.
   - Other services store only the global immutable `userId` they need.

7. **At-least-once is preferred over expensive exactly-once guarantees.**
   - retries + ACK/DLQ + idempotency are used where appropriate.

8. **Do not add infrastructure "just in case".**
   - benchmark first;
   - scale when an NFR is actually threatened.

## Files

- `01_PRODUCT_OVERVIEW.md`
- `02_REQUIREMENTS.md`
- `03_CAPACITY_ESTIMATION.md`
- `04_HIGH_LEVEL_ARCHITECTURE.md`
- `05_SERVICE_BOUNDARIES.md`
- `06_AUTH_AND_REGISTRATION.md`
- `07_USERS_AND_SOCIAL_GRAPH.md`
- `08_ROOMS_REALTIME_AND_CHAT.md`
- `09_MOVIE_SEARCH_AND_INDEXING.md`
- `10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md`
- `11_NOTIFICATIONS_MESSAGING_RELIABILITY.md`
- `12_DATA_OWNERSHIP_AND_CONSISTENCY.md`
- `13_DISTRIBUTED_SYSTEM_PATTERNS.md`
- `14_FAILURE_AND_RECOVERY_NOTES.md`
- `15_SEQUENCE_DIAGRAMS.md`
- `16_ARCHITECTURE_DECISIONS.md`
- `17_DECISION_LOG.md`
- `18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md`
- `19_IMPLEMENTATION_PLAN.md`
- `20_TESTING_AND_VALIDATION_PLAN.md`
- `21_OBSERVABILITY_AND_METRICS.md`
- `22_SECURITY_MODEL.md`
- `23_DATA_MODELS_DRAFT.md`
- `24_SCALING_AND_DEPLOYMENT_STRATEGY.md`
- `25_RISKS_AND_TRADEOFFS.md`
- `26_GLOSSARY.md`

## Important scope note

The target architecture is designed around **100,000 concurrent users**, but the actual MVP/demo deployment has a budget target of **<= $300/month**.

Those are deliberately different constraints:

- `100k concurrent` = target architecture/scalability model.
- `$300/month` = actual MVP infrastructure budget.

The MVP is not expected to physically provision infrastructure for 100k concurrent users.
