# KinVue — Risks and Tradeoffs

## 1. Rooms Redis is a critical dependency

Benefit:

- extremely simple shared low-latency state.

Risk:

- room availability depends heavily on Redis.

Mitigation:

- Redis HA;
- reconnect/resync;
- ephemeral semantics.

---

## 2. Redis Pub/Sub is not durable

Benefit:

- simple, low latency.

Risk:

- disconnected instances/clients miss events.

Mitigation:

- current state is stored separately;
- reconnect loads current state.

---

## 3. Event races are accepted

Benefit:

- avoids locks/consensus.

Risk:

- simultaneous controls can temporarily disagree.

Accepted because:

- users can immediately correct playback;
- business impact is low.

---

## 4. Ephemeral chat

Benefit:

- simple;
- no separate durable message subsystem.

Risk:

- chat history can disappear.

Accepted in v1.

If product changes, introduce durable store/service.

---

## 5. Meilisearch single-node/vertical-first

Benefit:

- low operational complexity.

Risk:

- peak search may exceed node capacity.

Mitigation:

- load test;
- vertical scale;
- only then horizontal design.

---

## 6. Eventual search consistency

Benefit:

- decouples writes from search availability.

Risk:

- new/updated movie may not appear immediately.

Accepted by requirements.

Immediate publish path + reconciliation reduces staleness.

---

## 7. Saga registration

Benefit:

- avoids 2PC.

Risk:

- temporary intermediate state;
- compensation/retries required.

Mitigation:

- PENDING identity;
- idempotent profile create;
- ACTIVE only after completion.

---

## 8. At-least-once notifications

Benefit:

- strong delivery reliability at practical complexity.

Risk:

- duplicates.

Mitigation:

- stable eventId;
- idempotency/dedup where needed;
- provider idempotency if supported.

---

## 9. CDN dependency

Benefit:

- essential media scalability.

Risk:

- external cost/outage dependency.

Mitigation:

- defer multi-CDN until justified;
- monitor hit ratio/egress.

---

## 10. 100k architecture vs $300 MVP

Risk:

- overbuilding target-scale infrastructure during MVP.

Mitigation:

- keep code/architecture scalable;
- provision only realistic demo capacity;
- use load testing rather than paid 100k production traffic.
