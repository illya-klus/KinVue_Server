# KinVue — Users and Social Graph

## Why MongoDB

Current reasons for using MongoDB in Users:

- document-oriented user aggregate;
- evolving/dynamic preferences;
- relatively simple access patterns;
- profile data often read together;
- horizontal partitioning/sharding remains possible if future metrics require it.

Not valid reasons by themselves:

- "Mongo is always faster";
- "1 million users requires Mongo".

PostgreSQL can also handle large user counts.

The choice is based on data shape and access patterns, not user count alone.

---

## User source of truth

Users Service is the source of truth for profile/social data.

Example user document:

```json
{
  "_id": "global-user-uuid",
  "username": "illya",
  "displayName": "Illya",
  "avatar": "...",
  "preferences": {
    "genres": ["sci-fi", "thriller"],
    "languages": ["uk", "en"],
    "autoplay": true
  }
}
```

Auth owns credentials/identity.

---

## Do not copy full User entities across services

Other services store only the identifiers they need.

Examples:

```text
Room:
hostId = userId

Chat:
authorId = userId

Notification:
recipientId = userId
```

They do not store an entire profile copy by default.

---

## Friendships

Do not embed an unbounded `friends: []` list inside the user document.

Use a separate collection:

```text
users
friendships
```

Canonical friendship example:

```json
{
  "_id": "...",
  "user1Id": "A",
  "user2Id": "B",
  "requestedBy": "A",
  "status": "ACCEPTED",
  "createdAt": "..."
}
```

For pending request:

```json
{
  "user1Id": "A",
  "user2Id": "C",
  "requestedBy": "A",
  "status": "PENDING"
}
```

## Canonical pair

Normalize the pair:

```text
user1Id = min(A, B)
user2Id = max(A, B)
```

Then use a unique compound index:

```text
{ user1Id: 1, user2Id: 1 }
```

This prevents duplicate friendship records.

Additional indexes may be needed on:

- `user1Id`;
- `user2Id`;
- `status`;
- usernames/search fields.

---

## Why not graph DB yet

Current requirements are mostly:

- get profile;
- get friends;
- check friendship;
- send friend request;
- accept friend request;
- find users.

There is no current requirement for:

- deep graph traversal;
- shortest-path search;
- multi-hop social queries;
- complex graph algorithms.

A graph database is therefore deferred.

---

## Data duplication/read models

Duplication is allowed when it is a deliberate projection for a hot read.

Example:

```text
user_watch_history:
userId
movieId
movieTitle
moviePoster
watchedAt
```

Movie remains the source of truth.

The duplicated title/poster is a projection/snapshot, not ownership transfer.

Use:

- API composition for occasional cross-domain reads;
- local projection/duplication for hot reads;
- events/eventual consistency to keep projections fresh when needed.
