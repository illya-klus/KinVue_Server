# KinVue — Scaling and Deployment Strategy

## General rule

Prefer:

1. simple architecture;
2. vertical scaling;
3. benchmarks;
4. horizontal scaling when proven necessary.

Do not introduce distributed complexity before evidence.

---

## Gateway

- stateless;
- horizontal scaling;
- LB in front.

Scale based on:

- CPU;
- latency;
- connections;
- RPS.

---

## Auth

- stateless app instances;
- LB;
- horizontally scalable.

PostgreSQL:

- HA/replication;
- failover.

Exact topology deferred.

---

## Users

- stateless app instances;
- LB if/when needed.

MongoDB:

- indexes first;
- replica set/HA;
- sharding only if storage/load metrics require it.

1M users alone does not justify sharding.

---

## Rooms

- horizontal application scaling is expected early because of WebSockets;
- own LB;
- shared Redis;
- Redis Pub/Sub;
- Redis HA.

Primary scaling dimension:

- open sockets;
- fan-out;
- realtime latency.

---

## Movie

- stateless service instances;
- scale API independently from media delivery.

PostgreSQL:

- source-of-truth HA.

Meilisearch:

- vertical scaling first;
- benchmark before distributed topology.

---

## Notifications

- multiple consumers can scale from RabbitMQ queue;
- at-least-once;
- monitor queue depth.

RabbitMQ HA exact topology deferred.

---

## Transcoding

Scale based on queue depth and compute capacity.

Workers are independent from Movie API.

This is a natural autoscaling workload.

---

## CDN/S3

Media delivery is offloaded from application infrastructure.

Target bandwidth is too large for backend proxying.

---

## MVP vs target production

### MVP

- actual traffic small;
- cost target <= $300/month;
- minimal viable instances;
- managed services where cost-effective;
- architecture remains compatible with future scale.

### Target architecture

- 100k concurrent users;
- 40k realtime room users;
- 46k streams;
- ~230 Gbps media egress baseline.

Do not provision target scale during MVP.
