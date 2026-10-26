# KinVue — Failure and Recovery Notes

This is not a fully completed failure-analysis document.

The decision was to stop expanding HLA and revisit deeper failures while implementing each service.

The notes below capture what has already been decided.

---

## Gateway instance dies

Expected behavior:

- LB stops routing new requests to the failed instance.
- Other stateless Gateway instances continue serving traffic.

No business state should live only in Gateway RAM.

---

## Rooms instance dies

Expected behavior:

- sockets connected to that instance close;
- clients reconnect through Rooms LB;
- clients may land on another instance;
- new instance authenticates them;
- current room state is read from shared Redis;
- client resynchronizes.

Rooms instances are disposable.

---

## Redis primary dies

Current direction:

- Redis HA;
- replication;
- automatic failover.

Tradeoff:

- async replication may lose the latest ephemeral update;
- zero data loss is not required for play/pause state.

The user experience should recover through resync.

---

## Pub/Sub event lost

Acceptable.

Pub/Sub is not the source of truth.

A reconnecting client reads current room state.

---

## Concurrent PLAY/PAUSE/SEEK

Temporary race is acceptable.

This is not a critical transaction.

Last processed state may win.

---

## Auth Service instance dies

Other Auth instances continue.

Existing users with valid JWTs can still use Gateway/Rooms because token validation is local.

Login/register/refresh availability depends on Auth cluster + Auth DB.

---

## Auth DB primary failure

Planned:

- replication;
- failover.

Detailed topology deferred.

---

## Users Service instance dies

Stateless instance can be replaced/restarted.

MongoDB remains the state store.

---

## MongoDB failure

Plan at HLD level:

- HA/replica set.

Exact configuration deferred.

---

## Meilisearch failure

Impact:

- search unavailable/stale.

Movies are not lost.

Recovery:

- restart/restore Meilisearch;
- rebuild/reconcile from Movie PostgreSQL.

This is why Meilisearch is not a source of truth.

---

## RabbitMQ failure during publish

If the event is important and producer uses Transactional Outbox:

- business transaction remains committed;
- outbox event remains pending;
- publisher retries after RabbitMQ returns.

---

## Notification consumer dies before ACK

RabbitMQ redelivers.

Duplicates may occur.

Use event ID/idempotency where duplicate visible effect is unacceptable.

---

## Transcoding worker dies

Queue retains/retries job according to implementation policy.

Another worker can process it.

Movie remains in `PROCESSING`/failure state until resolved.

---

## Admin upload interrupted

Use multipart/resumable upload.

Retry only missing parts.

Do not restart the entire 20 GB upload.

---

## CDN failure

Exact multi-CDN/failover strategy is deferred.

The application architecture keeps CDN/media path independent from API/realtime paths.

---

## S3/object storage failure

Treated as managed infrastructure in HLA v1.

Detailed multi-region replication/disaster-recovery decisions are deferred.

---

## Explicitly deferred

Full "kill every component" reliability review will happen service-by-service during implementation.

This is deliberate to avoid speculative over-engineering.
