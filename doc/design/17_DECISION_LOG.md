# KinVue — Decision Log

## Accepted

- 100k concurrent users is a target architecture model.
- MVP budget is <= $300/month.
- Gateway handles HTTP/API, not all external traffic.
- Rooms has separate WebSocket ingress.
- CDN has separate media ingress.
- Gateway and Rooms validate JWT locally.
- Auth Service handles token lifecycle.
- Auth app layer orchestrates registration.
- Registration uses `PENDING -> ACTIVE`.
- `Users.createProfile(userId)` is idempotent.
- Global immutable `userId` is shared by reference.
- Users Service owns profile/social data.
- MongoDB selected for Users v1.
- Friendships are stored in separate collection.
- Rooms are ephemeral.
- Rooms uses Redis shared state + Pub/Sub.
- Redis HA is required.
- Reconnect uses authoritative Redis state.
- Strict ordering of concurrent playback commands is not required.
- Chat remains inside Rooms.
- Chat can be ephemeral with TTL.
- Movie PostgreSQL is source of truth.
- Meilisearch is a derived index.
- Search uses debounce and minimum query length.
- Search result Redis cache is deferred.
- Meilisearch vertical scaling first.
- Movie indexing can use scheduled reconciliation with retry/overlap.
- Admin upload is direct multipart to S3.
- Transcoding is async through queue/workers.
- S3 is origin; CDN serves viewers.
- Backend does not proxy media.
- No separate Streaming Service v1.
- RabbitMQ used for notification-worthy async events.
- Manual ACK, retry x2, DLQ.
- At-least-once preferred over true exactly-once.
- Transactional Outbox should be used for important durable producer events.
- HLA v1 is frozen until detailed service design proves changes are needed.
- Auth token, password, compensation, and operator-bootstrap policy: [0020](../decisions/0020-auth-password-rs256-and-sessions.md), [0021](../decisions/0021-auth-policy-gates.md).
- Room lifecycle, durable Rooms data, registration username, and browser-session policy: [0022](../decisions/0022-room-policy-gates.md), [0023](../decisions/0023-rooms-durable-storage.md), [0024](../decisions/0024-registration-username-policy.md), [0025](../decisions/0025-browser-session-storage.md).
- Users, movie publication/media state, playback version, search, and upload policy: [0026](../decisions/0026-sprint-1-users-movie-policies.md).

## Rejected / Not selected now

- Gateway as the only public entry point.
- Gateway proxying all WebSocket traffic.
- Separate Chat Service.
- Separate Streaming Service.
- PostgreSQL for Rooms by default.
- Search Redis cache "because caching is good".
- Horizontal Meilisearch cluster before benchmarks.
- Kafka just for architecture prestige.
- 2PC for registration.
- Exactly-once push delivery promise.
- Full user object duplication in every service.
- Graph database for simple friendships.
- Replicating/clustering every component preemptively.

## Deferred

- Exact Redis topology/cluster vs Sentinel.
- Exact Mongo replica/sharding topology.
- Exact PostgreSQL failover implementation.
- Exact CDN provider/multi-CDN strategy.
- Exact push provider and idempotency capabilities.
- Exact object-storage bucket split.
- Exact transcoding platform.
- Full DR/multi-region.
- Durable chat history.
- Recommendation engine.
- Deep social-graph queries.
- Search horizontal scaling.
