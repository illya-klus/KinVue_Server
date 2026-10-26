# KinVue — Auth and Registration Design

## JWT model

Auth Service issues tokens.

Normal API requests do not call Auth Service.

```text
Client
  -> Gateway
     -> validate JWT locally
     -> target service
```

Gateway validates:

- signature;
- expiration;
- issuer;
- audience;
- relevant claims/scopes.

Rooms validates JWT during WebSocket handshake.

## Expired access token

Gateway does not automatically call Auth when a token expires.

Flow:

1. Client sends expired token.
2. Gateway returns `401`.
3. Client calls refresh endpoint.
4. Auth validates refresh/session state.
5. Auth issues a new access token.
6. Client retries the original request.

This prevents Auth from becoming a dependency for every API request.

---

## Auth scaling

Auth Service should be stateless at the application layer.

Conceptual deployment:

```text
Auth LB
  -> Auth #1
  -> Auth #2
  -> Auth #3
       |
       -> PostgreSQL HA
```

PostgreSQL remains the authoritative identity store.

Replication/failover is for HA.

---

## Global user identity

Use one immutable global `userId`, preferably UUID.

Example:

```text
userId = 550e8400-e29b-41d4-a716-446655440000
```

The same ID is referenced by:

- Auth;
- Users;
- Rooms;
- chat messages;
- notifications;
- watch history.

There are no distributed foreign keys between service databases.

---

## Registration consistency requirement

Registration is successful only when:

- Auth identity exists;
- Auth identity is `ACTIVE`;
- Users profile exists.

The client must not receive a successful registration response before that point.

---

## Registration owner

Current decision:

- registration orchestration lives inside Auth Service application workflow;
- Gateway does not orchestrate the business transaction;
- no separate Registration Orchestrator microservice is introduced yet.

Why not Gateway:

Gateway should remain responsible for:

- routing;
- auth validation;
- edge concerns.

It should not own:

- Saga state;
- business compensation;
- distributed workflow recovery.

---

## Registration Saga

State model:

```text
PENDING
  -> PROFILE_CREATING
  -> ACTIVE

or

PENDING
  -> PROFILE_CREATING
  -> RETRYING
  -> COMPENSATING
  -> COMPENSATED
```

Simplified flow:

```text
1. Auth generates global userId.

2. Auth creates identity:
   status = PENDING

3. Auth calls:
   Users.createProfile(userId)

4. Users operation is idempotent.

5. If profile exists/was created:
   Auth: PENDING -> ACTIVE

6. Only now:
   return 201 REGISTERED

7. If retries are exhausted:
   compensate/cancel/delete PENDING identity.
```

## Idempotent profile creation

Important failure:

```text
Auth -> Users CREATE profile
Users creates profile successfully
response Users -> Auth is lost
```

Auth cannot know whether creation happened.

Solution:

Retry the same operation.

`Users.createProfile(userId)` must be idempotent:

- first call -> create;
- repeated call for same `userId` -> success/already exists;
- no duplicate profile is created.

The goal is not "request executes exactly once".

The goal is:

**repeating the request is safe and converges to the same state.**

---

## Why not 2PC

True atomic commit across Auth PostgreSQL and Users MongoDB would introduce significantly more complexity.

Current preference:

- orchestrated Saga;
- retries;
- idempotency;
- compensation.

This provides strong-enough registration semantics for KinVue without a distributed transaction coordinator.

---

## Unique email

Do not implement:

1. check email exists;
2. create user.

That creates a race.

Use a database uniqueness constraint in Auth PostgreSQL:

```text
UNIQUE(email)
```

Let the authoritative store atomically reject duplicates.
