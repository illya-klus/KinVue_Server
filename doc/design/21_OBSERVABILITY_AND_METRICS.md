# KinVue — Observability and Metrics

## General principle

Scaling decisions must be based on measured saturation, not arbitrary RPS numbers.

---

## Global service metrics

Collect:

- request rate;
- error rate;
- p50/p95/p99 latency;
- CPU;
- memory;
- network in/out;
- open connections;
- event loop lag (Node.js);
- restart count;
- health/readiness state.

---

## Gateway

- HTTP RPS;
- JWT validation latency;
- 401/403 rate;
- upstream latency;
- per-service routing volume;
- active connections;
- saturation by instance.

---

## Auth

- login rate;
- registration rate;
- refresh rate;
- failed login rate;
- registration Saga state counts;
- PENDING registrations;
- compensation count;
- retry count;
- DB connection pool.

---

## Users

- profile read/write QPS;
- friendship operations/sec;
- user search latency;
- Mongo query latency;
- index effectiveness;
- document sizes.

---

## Rooms

- active WebSockets;
- sockets per instance;
- active rooms;
- users per room distribution;
- playback commands/sec;
- outgoing events/sec;
- reconnect rate;
- resync latency;
- Redis command latency;
- Pub/Sub latency;
- hot rooms;
- Redis memory;
- Redis failover count.

---

## Chat

- messages/sec;
- reactions/sec;
- duplicate retries;
- average payload size;
- TTL cleanup rate.

---

## Movie/Search

- search QPS;
- p95/p99 search latency;
- no-result rate;
- index size;
- indexing latency;
- reconciliation lag;
- stale-index detection;
- Meilisearch CPU/RAM.

---

## RabbitMQ

- publish rate;
- consume rate;
- unacked count;
- retry count;
- queue depth;
- DLQ depth;
- oldest message age;
- broker memory/disk alarms.

---

## Notifications

- send success rate;
- provider error rate;
- duplicate suppression;
- end-to-end delivery latency;
- retry count;
- DLQ count.

---

## Media

- upload throughput;
- multipart failures;
- abandoned uploads;
- transcoding queue depth;
- transcode duration;
- worker utilization;
- failed transcodes;
- output size;
- CDN hit ratio;
- origin bandwidth;
- CDN egress;
- stream-start latency.

---

## Capacity decision rule

Example:

```text
Expected load
  -> Load test
  -> Observe metrics
  -> Compare against NFR
  -> Optimize or scale
```

Do not say:

"10k RPS means 5 servers."

Say:

"At 10k RPS, this instance reaches CPU 90%, p95 350 ms, and violates the 200 ms NFR; therefore we optimize/scale."
