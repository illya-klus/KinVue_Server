# KinVue — Glossary

## HLA / HLD

High-Level Architecture / High-Level Design.

Shows major components and data paths, not implementation details.

## LLD

Low-Level Design.

Detailed APIs, classes, schemas, algorithms, error handling, etc.

## Source of Truth (SoT)

The authoritative system/store for a piece of data.

Example:

Movie PostgreSQL is the source of truth for movie metadata.

## Projection

A derived copy optimized for reading.

Example:

Meilisearch movie index.

## Eventual Consistency

Different representations can temporarily disagree but converge later.

## Idempotency

Repeating the same operation produces the same final effect.

## At-least-once

A message/operation may be delivered more than once but should not be silently lost.

## Exactly-once

A strong end-to-end guarantee that an effect happens one time.

Usually expensive/impossible across independent external systems without special support.

## Saga

A distributed business workflow composed of multiple local transactions plus retries/compensations.

## Compensation

An action that semantically undoes a previous Saga step.

## Transactional Outbox

Stores a business change and an event intent in the same local DB transaction, then publishes the event asynchronously.

## DLQ

Dead-Letter Queue.

Messages that failed processing after retry policy.

## Pub/Sub

Publish/Subscribe communication.

Publisher emits to a channel/topic; subscribers receive.

KinVue uses Redis Pub/Sub for ephemeral Rooms events.

## WebSocket

Long-lived full-duplex connection.

Both client and server can send events without opening a new HTTP request each time.

## CDN

Content Delivery Network.

Caches media close to users and protects origin from serving every byte directly.

## Origin

The authoritative storage behind CDN.

KinVue origin: S3/object storage.

## Presigned URL / Signed URL

Temporary authorized URL allowing direct upload/download without exposing permanent public access.

## HLS

HTTP Live Streaming.

Media is prepared as manifests and segments/renditions.

## Backpressure

Mechanism that prevents a fast producer from overwhelming a slower consumer.

Transcode queue provides backpressure between uploads and CPU-heavy workers.

## p95 / p99

Latency percentiles.

p95 = 95% of requests are faster than that value.

## Saturation

Point where a resource is near its practical capacity and latency/errors rise sharply.
