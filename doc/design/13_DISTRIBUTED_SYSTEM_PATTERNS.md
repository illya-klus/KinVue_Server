# KinVue — Distributed Systems Patterns Used

## 1. Saga

Question it solves:

> How do I coordinate one business operation across multiple independent services/databases?

KinVue use:

- registration across Auth + Users.

Current form:

- orchestrated Saga inside Auth application workflow;
- PENDING state;
- retry;
- idempotent step;
- compensation.

---

## 2. Transactional Outbox

Question it solves:

> How do I avoid losing a business event between my database commit and RabbitMQ publish?

Mechanism:

```text
local DB transaction:
business write
+
outbox write
```

Async publisher later sends the outbox event to the broker.

---

## 3. Idempotency

Question it solves:

> What if I do not know whether the previous request/event succeeded and I must retry?

KinVue examples:

- `Users.createProfile(userId)`
- chat send using stable `messageId`
- search index upsert by stable `movieId`
- event dedup by stable `eventId`

Core idea:

**Do not require the transport to execute exactly once. Make repeats safe.**

---

## 4. At-least-once delivery

Used for notifications.

Properties:

- retry until success/retry exhaustion;
- duplicates possible;
- consumers should be idempotent where necessary.

---

## 5. DLQ

Used when repeated processing fails.

Purpose:

- isolate poison/problem messages;
- avoid infinite retry loop;
- enable operational recovery.

---

## 6. Pub/Sub

Used inside realtime Rooms.

Purpose:

- propagate ephemeral room events between Rooms instances.

Important:

Redis Pub/Sub is not a durable history.

Current state lives separately in Redis state keys.

---

## 7. Reconciliation

Used for Movie -> Meilisearch.

Purpose:

- repair stale/missed search projections;
- rebuild disposable indexes;
- prefer simple eventual repair over over-engineered synchronous consistency.

---

## 8. CQRS-like read projection

Not full CQRS, but the system uses the same idea in places:

- PostgreSQL movie source of truth;
- Meilisearch read/search projection;
- optional user-local movie snapshots for hot reads.

---

## 9. Backpressure / load leveling

Used in transcoding pipeline.

Uploads can complete faster than transcoders can process them.

Queue absorbs the burst.

Workers consume at a sustainable rate.

---

## 10. Stateless horizontal scaling

Used for:

- Gateway;
- Auth application instances;
- Users application instances;
- Rooms application instances;
- Movie application instances.

State is kept in external stores where required.
