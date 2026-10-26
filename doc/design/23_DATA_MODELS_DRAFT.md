# KinVue — Draft Data Models

These are conceptual models, not final schemas.

---

## Auth identity

```text
AuthIdentity
- userId: UUID
- email
- passwordHash
- status: PENDING | ACTIVE | DISABLED
- createdAt
- updatedAt
```

Constraints:

- unique(email)
- userId immutable

---

## User profile

```text
User
- userId
- username
- displayName
- avatar
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
- status: PENDING | ACCEPTED | REJECTED/BLOCKED (future)
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

Possible statuses:

- DRAFT
- SCHEDULED
- UPLOADING
- PROCESSING
- READY
- PUBLISHED
- FAILED/ABANDONED

Exact final state machine should be normalized in detailed design.

---

## Room state (Redis)

```text
room:{roomId}:state
- roomId
- ownerId
- visibility
- movieId?
- playbackStatus: PLAYING | PAUSED
- position
- updatedAt
- permissions/version? (optional)
- expiresAt/TTL
```

---

## Room members

```text
room:{roomId}:members
- userId
- role/permissions
- connection/presence metadata
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
