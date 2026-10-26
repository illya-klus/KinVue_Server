# KinVue — Rooms, Realtime, Redis, Reconnect, Chat

## Public realtime entry point

Rooms has its own public WebSocket ingress.

Conceptually:

```text
api.kinvue.com   -> Gateway/API LB
rooms.kinvue.com -> Rooms LB
```

Publicly reachable does not mean unauthenticated.

The Rooms WebSocket handshake validates JWT.

---

## Why WebSocket bypasses Gateway

Gateway handles HTTP/API traffic.

Rooms handles long-lived realtime connections.

If WebSockets were proxied through Gateway, both Gateway and Rooms would have to carry the realtime connection load.

Current design:

```text
API:
Client -> Gateway LB -> Gateway -> services

Realtime:
Client <-> Rooms LB <-> Rooms instances

Media:
Client <- CDN <- S3
```

---

## WebSocket lifecycle

Handshake:

1. Client connects to Rooms endpoint.
2. Client supplies access token + room context.
3. Rooms validates JWT locally.
4. Rooms checks room access/permissions.
5. Connection accepted.
6. Socket is associated with:
   - userId;
   - roomId;
   - permissions.

After handshake, the token does not need to be resent on every play/pause/chat event.

---

## Horizontal scaling

Target:

- ~40,000 concurrent WebSocket connections.

Rooms is horizontally scalable:

```text
Rooms LB
  -> Rooms #1
  -> Rooms #2
  -> Rooms #3
```

Each socket is owned by the instance it connected to.

Example:

```text
User A -> Rooms #1
User B -> Rooms #3
```

They can still be in the same logical room.

---

## Redis responsibilities

Shared Redis HA is used for:

1. Authoritative current room state.
2. Cross-instance Pub/Sub.
3. Presence/session metadata.
4. Ephemeral chat/reactions with TTL.

Conceptual key groups:

```text
room:{roomId}:state
room:{roomId}:members
room:{roomId}:messages
room:{roomId}:events
```

---

## Cross-instance synchronization

Problem:

- A is connected to Rooms #1.
- B is connected to Rooms #3.
- A presses PAUSE.

Flow:

```text
A -> Rooms #1
Rooms #1 -> update Redis room state
Rooms #1 -> PUBLISH room:{id} PAUSE
Redis Pub/Sub -> Rooms #1/#2/#3 subscribers
Rooms #3 -> B
```

Redis Pub/Sub is for ephemeral realtime propagation.

It is not a durable event journal.

---

## Reconnect and resync

If a Rooms instance dies:

```text
User B -> Rooms #2
Rooms #2 dies
WebSocket closes
```

Client reconnects through LB and may land on another instance.

New instance:

1. authenticates user;
2. validates room access;
3. loads current state from Redis;
4. sends authoritative state to the client;
5. subscribes/continues live events.

Pub/Sub history does not need to be replayed.

The reconnecting client only needs **the current state now**.

---

## Playback state model

Do not write current position every second.

Store a synchronization point:

```text
status = PLAYING
position = 482.5
updatedAt = 17:42:10
```

If now is 7 seconds later:

```text
currentPosition ~= 482.5 + 7
```

If status is `PAUSED`, current position is the stored position.

---

## Concurrent control races

Current product decision:

- strict conflict resolution is unnecessary;
- this is not a financial transaction;
- if two authorized users press play/pause/seek simultaneously, temporary race behavior is acceptable;
- last processed state may win.

Optional future hardening:

- monotonic state version;
- clients ignore stale versions.

This is useful for network reordering but is not required to make the product safe.

---

## Optional countdown UX

Possible UX:

```text
"Playback will pause in 3..."
"2..."
"1..."
PAUSE
```

This may reduce surprising simultaneous control changes.

It is a UX feature, not a consistency solution.

---

## Redis HA

Single Redis would be a critical SPOF.

Current direction:

- replication;
- automatic failover;
- Redis HA.

Important tradeoff:

Redis replication may be asynchronous.

A rare failover may lose the most recent ephemeral room update.

That is acceptable for KinVue room state compared to introducing bank-grade coordination.

---

## Chat

Current decision:

- chat is part of Rooms;
- no separate Chat Service;
- same WebSocket;
- same Redis HA;
- TTL-based history;
- ephemeral semantics.

Events can share one connection:

```text
room.play
room.pause
room.seek
chat.message
chat.reaction
presence.*
```

### Chat retry/dedup

If the client retries sending a message, use a client-generated `messageId`.

Example:

```text
messageId = msg_abc123
```

Repeated sends of the same ID should not create duplicate visible messages.

This gives:

- at-least-once retry behavior;
- idempotent visible effect.

True distributed exactly-once is not required.

---

## When to extract Chat Service

Only after real requirements justify it:

- durable history;
- DMs outside rooms;
- moderation;
- independent scaling;
- global search;
- unread counters;
- attachment pipeline.
