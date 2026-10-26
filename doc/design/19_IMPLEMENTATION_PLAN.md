# KinVue — Implementation Plan from HLA to Code

## Principle

Do not implement the whole HLA at once.

Go service-by-service / vertical-slice-by-vertical-slice.

For each service:

1. Requirements.
2. API/contracts.
3. Data model.
4. Detailed flows.
5. Consistency.
6. Failure cases.
7. Scaling assumptions.
8. Reliability.
9. Tests.
10. Implementation.
11. Load/failure validation.
12. Update HLA/ADR if evidence changes the design.

---

## Suggested order

### Phase 1 — Foundation

- monorepo/service skeletons;
- shared contracts;
- local Docker environment;
- logging;
- health endpoints;
- configuration/secrets pattern;
- CI basics.

### Phase 2 — Auth

Implement:

- register;
- login;
- refresh;
- logout/revoke;
- JWT signing/verification;
- PENDING/ACTIVE registration workflow;
- idempotent Users profile creation contract.

### Phase 3 — Users

Implement:

- user profile;
- preferences;
- friendships collection;
- friend request;
- accept/reject;
- user lookup/search.

### Phase 4 — Movie metadata/search

Implement:

- movie source-of-truth schema;
- admin create/edit;
- watchlist/saved movies;
- Meilisearch index;
- debounce/minimum query behavior;
- reconciliation job;
- scheduled publish.

### Phase 5 — Rooms basic

Implement:

- create/join/leave;
- private/public;
- permissions;
- Redis room state;
- TTL;
- WebSocket ingress;
- JWT handshake validation.

### Phase 6 — Rooms horizontal realtime

Implement:

- multiple Rooms instances;
- Redis Pub/Sub adapter;
- cross-instance broadcast;
- reconnect/resync;
- playback state model.

### Phase 7 — Room chat/reactions

Implement:

- chat over same WebSocket;
- message IDs;
- idempotent retry behavior;
- Redis TTL history;
- reactions.

### Phase 8 — Notifications

Implement:

- RabbitMQ;
- events from Users/Rooms;
- Notifications consumer;
- manual ACK;
- retry x2;
- DLQ;
- optional dedup;
- Transactional Outbox where producer durability requires it.

### Phase 9 — Media upload

Implement:

- movie metadata first;
- presigned multipart upload;
- direct S3 upload;
- upload status lifecycle;
- orphan cleanup.

### Phase 10 — Transcoding

Implement:

- queue;
- workers;
- HLS output;
- retry/failure states;
- READY state.

### Phase 11 — CDN delivery

Implement:

- private origin;
- signed media access;
- CDN;
- HLS player integration.

### Phase 12 — Production hardening

- load tests;
- failure injection;
- DB HA;
- Redis failover;
- RabbitMQ HA;
- observability;
- security audit;
- autoscaling;
- cost review;
- documentation refresh.

---

## HLA change rule

Do not modify HLA because a technology exists.

Modify HLA only if:

- a requirement needs it;
- a load test proves it;
- a failure test proves it;
- a bounded context genuinely separates;
- operational cost/complexity justifies it.
