# KinVue — Data Ownership and Consistency

## Sources of truth

### Auth PostgreSQL

Source of truth for:

- identity;
- credentials;
- account activation state;
- refresh/session state.

### Users MongoDB

Source of truth for:

- user profile;
- preferences;
- friendships;
- social/user data.

### Movie PostgreSQL

Source of truth for:

- movie metadata;
- movie status;
- publish state;
- media keys;
- genres/duration/catalog metadata.

### Meilisearch

Not a source of truth.

It is a derived search projection.

### Rooms Redis

Authoritative current state for active ephemeral rooms.

This is not long-term business history.

### S3/Object Storage

Source of truth for the actual stored media objects.

---

## Global IDs

Use stable immutable IDs.

### User

Global UUID is created once and referenced everywhere.

### Movie

Stable `movieId` is referenced by:

- Rooms;
- user history/projections;
- search index;
- media key structure.

### Room

Ephemeral stable room identifier for the lifetime of the room.

---

## No distributed foreign keys

Do not try to create DB-level foreign keys across services.

Example:

Rooms can store:

```text
hostId = userId
movieId = movieId
```

It does not enforce an FK into Users/Movie databases.

Cross-service integrity is handled by:

- APIs;
- workflow rules;
- events;
- reconciliation;
- product semantics.

---

## Cross-domain reads

Two patterns are acceptable.

### API composition

For occasional cross-domain reads:

```text
Gateway
  -> Users
  -> Movies
  -> compose response
```

Use when duplication is not worth maintaining.

### Local projection/duplication

For hot reads, duplicate only the fields needed.

Example:

```text
user_watch_history:
userId
movieId
movieTitle
moviePoster
watchedAt
```

Movie remains source of truth.

Projection can be eventually consistent.

---

## Consistency model by domain

### Auth registration

Strong-ish business guarantee via Saga:

- no successful registration response until Auth + Users state is acceptable.

### Movie search

Eventual consistency acceptable.

### Room playback

Strict ordering is not required.

Temporary races are acceptable.

### Notifications

At-least-once processing.

### Chat

Ephemeral in v1.

Idempotent visible effect on retries is desirable.

---

## Duplication rule

Do not copy entire domain entities everywhere.

Duplicate only when:

- a read pattern justifies it;
- ownership remains explicit;
- staleness is acceptable;
- update/rebuild strategy is defined.
