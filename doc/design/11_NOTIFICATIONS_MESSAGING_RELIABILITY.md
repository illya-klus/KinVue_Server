# KinVue — Notifications, RabbitMQ, Delivery Reliability

## Event ownership

Business events are produced by the domain that owns the action.

Examples:

- Rooms -> `ROOM_INVITED`
- Users -> `FRIEND_REQUEST_CREATED`
- Users -> `FRIEND_REQUEST_ACCEPTED`

Gateway should not publish business events just because it received the HTTP request.

---

## Async notification flow

```text
Producer Service
  -> RabbitMQ
  -> Notifications Service
  -> Push Provider / notification channel
```

The original business request should not wait for push delivery.

---

## Delivery semantics

Current decision:

**At-least-once processing**

RabbitMQ flow:

1. Consumer receives message.
2. Notification is processed.
3. Consumer sends ACK only after successful processing.
4. RabbitMQ removes message only after ACK.
5. Failure -> NACK/retry.
6. Retry policy: **2 retries**.
7. Retry exhaustion -> **DLQ**.

---

## Consumer crash before ACK

Scenario:

1. Notification sent successfully.
2. Consumer crashes before ACK.
3. RabbitMQ sees no ACK.
4. Message is redelivered.

This can cause duplicates.

That is expected under at-least-once semantics.

---

## Exactly-once reality

True end-to-end exactly-once is generally impossible for an external push provider unless the provider itself supports compatible idempotency/transaction semantics.

Two unsafe orders:

```text
mark processed -> crash -> send never happened
```

or:

```text
send -> crash -> mark not recorded -> retry -> duplicate
```

Therefore the system should not pretend to guarantee true exactly-once push delivery.

Preferred model:

- at-least-once;
- event IDs;
- idempotent processing where possible;
- provider idempotency key if supported.

---

## Deduplication

Each event should have a stable unique `eventId`.

Example:

```json
{
  "eventId": "evt_928371",
  "type": "ROOM_INVITED",
  "recipientId": "user-42",
  "roomId": "room-123"
}
```

A shared/persistent dedup store can remember processed IDs.

A dedicated Notifications Redis is one possible implementation.

Important:

Do not reuse the Rooms Redis simply because it already exists.

Different bounded context and failure domain.

---

## Transactional Outbox

Problem:

```text
business DB write succeeds
RabbitMQ publish fails
```

Without Outbox:

- business state exists;
- event can be lost forever.

Outbox solution:

In one local DB transaction:

```text
write business state
+
write outbox event
```

Then an async publisher sends pending outbox events to RabbitMQ.

Benefits:

- application instance can die;
- broker can be temporarily down;
- event intent remains durable.

Important limitation:

Outbox gives at-least-once publishing, not magical exactly-once.

A publisher can crash after publish but before marking the outbox row processed.

Therefore consumers must tolerate duplicate events.

---

## Where to use Outbox

Use it for important durable business events.

Examples:

- durable friendship event;
- durable invitation event;
- critical account/business workflow.

Do not use it for every realtime event:

- PLAY;
- PAUSE;
- SEEK;
- reactions.

Those are ephemeral and can be reconstructed/resynced from current state.

---

## DLQ

Dead-letter queue contains messages that could not be processed after configured retries.

Operational requirements:

- monitor DLQ depth;
- inspect root causes;
- support replay/manual handling;
- do not silently ignore DLQ messages.
