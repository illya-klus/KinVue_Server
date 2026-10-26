# KinVue — Architecture Decisions (ADR Summary)

## ADR-001 — Separate HTTP, Realtime, Media ingress

**Decision**

Use separate external paths:

- API -> Gateway cluster.
- WebSocket -> Rooms cluster.
- Media -> CDN.

**Reason**

The workloads have fundamentally different connection, latency, scaling, and bandwidth properties.

---

## ADR-002 — Gateway does not proxy Rooms WebSockets

**Decision**

Rooms has a direct public WebSocket entry point behind its own LB.

**Reason**

Avoid turning Gateway into an unnecessary long-lived realtime bottleneck.

---

## ADR-003 — JWT validation is local

**Decision**

Gateway and Rooms validate access tokens locally.

**Reason**

Avoid Auth round-trip for every request/event.

---

## ADR-004 — Rooms uses shared Redis state + Pub/Sub

**Decision**

Redis handles:

- room current state;
- cross-instance Pub/Sub;
- presence;
- ephemeral chat.

**Reason**

Low-latency read/write workload and horizontal Rooms scaling.

---

## ADR-005 — Rooms are ephemeral

**Decision**

Do not introduce PostgreSQL for Rooms v1 simply because every service "needs a DB".

**Reason**

Room state behaves like a call/session and does not currently require long-term durability.

---

## ADR-006 — Chat stays inside Rooms

**Decision**

No separate Chat Service initially.

**Reason**

Chat is room-scoped, low-complexity, and shares room membership/realtime context.

---

## ADR-007 — Movie PostgreSQL is source of truth

**Decision**

Meilisearch is only a derived search index.

**Reason**

Search index must be rebuildable and eventual consistency is acceptable.

---

## ADR-008 — Search cache deferred

**Decision**

No Redis search-result cache initially.

**Reason**

Unknown hit rate and typo/prefix searches create many distinct queries.

Use debounce and minimum query length first.

---

## ADR-009 — Search scales vertically first

**Decision**

Benchmark before introducing distributed search topology.

**Reason**

Do not add complexity before evidence.

---

## ADR-010 — Media bytes bypass backend

**Decision**

Video flows through CDN/Object Storage, not application servers.

**Reason**

Estimated baseline media bandwidth is ~230 Gbps.

---

## ADR-011 — No separate Streaming Service v1

**Decision**

Keep media-control responsibilities in Movie + processing pipeline.

**Reason**

Dedicated service does not yet have enough independent responsibility.

---

## ADR-012 — Direct multipart media upload

**Decision**

Admin uploads directly to S3 using presigned multipart upload.

**Reason**

Avoid proxying 20 GB uploads through backend and support resumability.

---

## ADR-013 — Async transcoding via queue + workers

**Decision**

Use queue and horizontally scalable transcoding workers.

**Reason**

Expensive CPU workloads require backpressure and independent scaling.

---

## ADR-014 — Auth owns registration Saga

**Decision**

Registration workflow lives in Auth application layer.

**Reason**

Gateway should not own distributed business workflows; a separate Saga service is unnecessary for one workflow.

---

## ADR-015 — Registration uses PENDING + idempotency + retry + compensation

**Decision**

No 2PC.

**Reason**

Strong-enough semantics with lower complexity.

---

## ADR-016 — Global immutable user UUID

**Decision**

One stable user ID across services.

**Reason**

Avoid copying full user entities and avoid distributed foreign keys.

---

## ADR-017 — Users uses separate friendships collection

**Decision**

Do not embed unbounded friend arrays in User.

**Reason**

Cleaner relationship model, unique pair enforcement, independent indexing.

---

## ADR-018 — Notifications use at-least-once

**Decision**

Manual ACK + retry x2 + DLQ.

**Reason**

Exactly-once is too expensive/unrealistic for external push delivery.

---

## ADR-019 — Transactional Outbox for important durable events

**Decision**

Use Outbox where losing the DB->broker event is unacceptable.

**Reason**

Closes the "DB commit succeeded, publish failed" gap.

---

## ADR-020 — Movie search reconciliation may be cron-based

**Decision**

For the small, read-heavy catalog, use retryable incremental/full reconciliation with overlap.

**Reason**

Simpler than event-driven indexing and sufficient under eventual-consistency requirements.

---

## ADR-021 — Failure analysis continues during implementation

**Decision**

Freeze HLA v1 rather than replicate/cluster every component preemptively.

**Reason**

Avoid speculative over-engineering; revisit with implementation/load-test evidence.
