# KinVue — Draft Data Models

These are conceptual models, not final schemas. The notes below record fields observed in the current repository and accepted policies; they do not imply that every associated feature is complete.

---

## Auth identity

```text
AuthIdentity
- userId: UUID
- email
- passwordHash
- status: PENDING | PROFILE_CREATING | ACTIVE | COMPENSATING | COMPENSATED | DISABLED
- createdAt
- updatedAt
```

Constraints:

- unique(email)
- userId immutable
- Current Auth contract also has `AuthUser` (id, unique email, role, provider, providerUserId) and `RefreshSession` (userId, tokenHash, rotatedFromSessionId, revokedAt, expiresAt, timestamps). See `services/auth/src/prisma/contract.prisma` and migrations for implemented schema details.

---

## User profile

```text
User
- userId
- username
- displayName
- avatarUrl
- preferences
- createdAt
- updatedAt
```

---

## Friendship

```text
Friendship
- id
- user1Id
- user2Id
- requestedBy
- status: PENDING | ACCEPTED | REJECTED
- createdAt
- updatedAt
```

Constraint:

- unique(user1Id, user2Id)

Normalize pair order.

---

## Movie

```text
Movie
- movieId
- title
- description
- genres[]
- duration
- posterKey
- status
- publishAt?
- mediaKey?
- createdAt
- updatedAt
```

Current Movie schema separates `publication_status` from `media_status`; see [0026](../decisions/0026-sprint-1-users-movie-policies.md). Publication values are DRAFT, SCHEDULED, PUBLISHED. Media values include NONE, UPLOADING, UPLOAD_FAILED, ABANDONED, PROCESSING, READY, PROCESSING_FAILED. Do not collapse the two state machines.

The repository migrations define the concrete PostgreSQL columns and enum values; consult `services/movie/migrations/` before changing a schema. The state machine and allowed transitions are specified in 0026.

---

## Room state (Redis)

```text
room:{roomId}:state
- roomId
- ownerId
- visibility
- movieId?
- status: ACTIVE | CLOSED
- playbackStatus: PLAYING | PAUSED
- positionSeconds
- version (monotonic integer per room)
- createdAt / TTL
```

---

## Room members

```text
room:{roomId}:members
- userId
- role: OWNER | CONTROLLER | VIEWER
- presence: ONLINE | DISCONNECTED | LEFT
- joinedAt / lastHeartbeatAt

Room invite token hashes, durable invitation rows, scheduled-view records, and outbox events belong in the accepted Rooms PostgreSQL design [0023](../decisions/0023-rooms-durable-storage.md). They are not implemented by the current Redis live-state slice.
```

---

## Chat message

```text
ChatMessage
- messageId
- roomId
- authorId
- text
- createdAt
```

Stored ephemerally in Redis v1.

---

## Notification event

```text
DomainEvent
- eventId
- type
- occurredAt
- producer
- recipientId?
- payload
```

---

## Outbox event

```text
OutboxEvent
- eventId
- type
- payload
- status: PENDING | PUBLISHED
- createdAt
- publishedAt?
- retryCount?
```

---

## Movie search projection

Meilisearch document may include:

```text
movieId
title
genres
description/shortDescription
poster
publishStatus
searchable/filterable fields
```

This document is not the source of truth.

---

## User movie projection (optional)

Only if hot read pattern justifies it:

```text
UserMovieProjection
- userId
- movieId
- movieTitle
- moviePoster
- watchedAt
```

The duplicated movie fields are projections/snapshots.
