# KinVue — Testing and Validation Plan

## Goal

Validate assumptions instead of trusting architecture diagrams.

---

## 1. Gateway load test

Measure:

- RPS;
- p50/p95/p99 latency;
- CPU;
- memory;
- event loop lag;
- JWT verification cost;
- error rate.

Test horizontal scaling behind LB.

---

## 2. Rooms WebSocket load test

Target model:

- 40k concurrent WebSockets;
- ~6.7k incoming playback commands/sec;
- ~26.7k outgoing deliveries/sec;
- ~4k heartbeat events/sec.

Test:

- connection establishment rate;
- steady-state sockets;
- fan-out;
- cross-instance Pub/Sub latency;
- reconnect storm;
- room hot spots.

---

## 3. Rooms failure test

Scenarios:

- kill one Rooms instance;
- reconnect clients;
- verify state resync;
- Redis primary failover;
- Pub/Sub temporary interruption;
- stale/out-of-order events.

---

## 4. Search load test

Target:

- ~3.6k average QPS;
- ~7–11k peak QPS.

Measure:

- p95/p99 search latency;
- CPU;
- RAM;
- indexing impact;
- concurrency;
- response size.

Decision gate:

Only add horizontal search topology if vertical scaling fails the NFR/cost target.

---

## 5. Chat load test

Target:

- ~667 incoming msg/sec;
- ~2.7k outgoing deliveries/sec;
- reactions.

Test:

- same WebSocket as room events;
- duplicate message retry;
- TTL cleanup;
- payload-size limits.

---

## 6. RabbitMQ/Notifications reliability

Scenarios:

- consumer crash before ACK;
- provider timeout;
- retry x2;
- DLQ routing;
- duplicate event delivery;
- RabbitMQ unavailable;
- Outbox publisher restart.

---

## 7. Registration Saga tests

Scenarios:

- Users unavailable;
- response lost after Users created profile;
- Auth restart during registration;
- duplicate registration request;
- retry exhaustion;
- compensation;
- unique email race.

---

## 8. Movie indexing tests

Scenarios:

- Meilisearch unavailable;
- cron retry;
- checkpoint does not advance on failure;
- overlap window causes safe duplicate upsert;
- scheduled publish;
- full rebuild.

---

## 9. Media upload tests

Scenarios:

- interrupted multipart upload;
- retry missing parts;
- abandoned upload cleanup;
- malformed upload;
- size limits;
- presigned URL expiration.

---

## 10. Transcoding tests

Scenarios:

- worker crash;
- job retry;
- poison media;
- queue backlog;
- multiple workers;
- output validation.

---

## 11. CDN/media tests

Validate:

- signed URL behavior;
- cache hit/miss;
- private origin access;
- HLS playback;
- token expiry;
- origin not directly public.

---

## 12. Cost validation

Before production-like deployment:

- CDN egress model;
- storage;
- transcoding compute;
- Redis;
- databases;
- broker;
- logging/metrics.

Remember:

100k target architecture and $300/month MVP are different constraints.
