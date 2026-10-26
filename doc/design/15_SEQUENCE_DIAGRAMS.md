# KinVue — Sequence Diagrams v1

These diagrams are design tools. They should evolve as implementation becomes concrete.

---

## 1. Login

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant A as Auth Service
    participant DB as Auth PostgreSQL

    C->>G: POST /auth/login
    G->>A: Forward credentials
    A->>DB: Validate identity/credentials
    DB-->>A: User/session data
    A-->>G: Access + Refresh token
    G-->>C: Tokens
```

---

## 2. Normal authenticated API request

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant S as Target Service

    C->>G: Request + JWT
    G->>G: Validate JWT locally
    G->>S: Forward trusted request/context
    S-->>G: Response
    G-->>C: Response
```

Auth Service is not called.

---

## 3. Refresh token

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant A as Auth Service

    C->>G: API request with expired access token
    G-->>C: 401
    C->>G: POST /auth/refresh
    G->>A: Refresh request
    A->>A: Validate refresh/session
    A-->>G: New access token
    G-->>C: New access token
```

---

## 4. Registration Saga

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant A as Auth Service
    participant ADB as Auth PostgreSQL
    participant U as Users Service
    participant UDB as MongoDB

    C->>G: POST /register
    G->>A: Register
    A->>A: Generate global userId
    A->>ADB: Create identity(status=PENDING)
    A->>U: createProfile(userId)
    U->>UDB: Idempotent create
    UDB-->>U: Created / already exists
    U-->>A: Success
    A->>ADB: PENDING -> ACTIVE
    A-->>G: 201 Registered
    G-->>C: 201 Registered
```

Failure:

- retry `createProfile`;
- compensate pending Auth identity after retry exhaustion.

---

## 5. Create room

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant R as Rooms Service
    participant Redis as Redis

    C->>G: POST /rooms
    G->>G: Validate JWT
    G->>R: Create room
    R->>Redis: Store room state
    Redis-->>R: OK
    R-->>G: Room created
    G-->>C: 201 + room
```

---

## 6. WebSocket join

```mermaid
sequenceDiagram
    participant C as Client
    participant LB as Rooms LB
    participant R as Rooms Instance
    participant Redis as Redis

    C->>LB: WebSocket handshake + JWT + roomId
    LB->>R: Route connection
    R->>R: Validate JWT
    R->>Redis: Load/check room + permissions
    Redis-->>R: Room state
    R-->>C: Accept WebSocket + current state
```

---

## 7. Cross-instance PAUSE

```mermaid
sequenceDiagram
    participant A as User A
    participant R1 as Rooms #1
    participant Redis as Redis State/PubSub
    participant R3 as Rooms #3
    participant B as User B

    A->>R1: PAUSE
    R1->>Redis: Update authoritative room state
    R1->>Redis: PUBLISH room event
    Redis-->>R3: PAUSE event
    R3-->>B: PAUSE
```

---

## 8. Reconnect and resync

```mermaid
sequenceDiagram
    participant B as User B
    participant R2 as Rooms #2
    participant LB as Rooms LB
    participant R3 as Rooms #3
    participant Redis as Redis

    B--xR2: Connection lost / R2 dies
    B->>LB: Reconnect + JWT + roomId
    LB->>R3: Route new socket
    R3->>Redis: GET current room state
    Redis-->>R3: PLAYING + position + updatedAt
    R3-->>B: STATE_SYNC
```

---

## 9. Movie search

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant M as Movie Service
    participant S as Meilisearch

    C->>C: Debounce typing
    C->>G: GET /movies/search?q=...
    G->>M: Search
    M->>S: Query index
    S-->>M: Search results
    M-->>G: Results
    G-->>C: Results
```

---

## 10. Movie direct upload and processing

```mermaid
sequenceDiagram
    participant A as Admin
    participant G as Gateway
    participant M as Movie Service
    participant DB as Movie PostgreSQL
    participant S3 as S3
    participant Q as Transcode Queue
    participant W as Transcode Worker

    A->>G: Create movie metadata
    G->>M: Create movie
    M->>DB: INSERT movie(status=UPLOADING)
    M-->>A: movieId + presigned multipart upload
    A->>S3: Direct multipart upload
    S3->>Q: Upload completed job
    Q->>W: Transcode job
    W->>S3: Read original
    W->>W: Generate HLS renditions
    W->>S3: Write HLS output
```

---

## 11. Media playback

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant M as Movie Service
    participant CDN as CDN
    participant S3 as S3

    C->>G: Request media access
    G->>M: Authorize movie playback
    M-->>G: Signed media access
    G-->>C: Signed CDN URL/token
    C->>CDN: Request HLS segment
    alt CDN hit
        CDN-->>C: Segment
    else CDN miss
        CDN->>S3: Fetch origin object
        S3-->>CDN: Segment
        CDN-->>C: Segment
    end
```

---

## 12. Notification with RabbitMQ

```mermaid
sequenceDiagram
    participant P as Producer Service
    participant MQ as RabbitMQ
    participant N as Notifications
    participant Push as Push Provider

    P->>MQ: Business event
    MQ->>N: Deliver message
    N->>Push: Send notification
    alt success
        Push-->>N: Success
        N->>MQ: ACK
    else failure
        N->>MQ: NACK / retry
    end
```

---

## 13. Transactional Outbox

```mermaid
sequenceDiagram
    participant P as Producer Service
    participant DB as Producer DB
    participant O as Outbox Publisher
    participant MQ as RabbitMQ

    P->>DB: BEGIN
    P->>DB: Business write
    P->>DB: Outbox event write
    P->>DB: COMMIT
    O->>DB: Read pending outbox
    O->>MQ: Publish event
    MQ-->>O: Confirm
    O->>DB: Mark outbox event published
```

---

## 14. Search reconciliation

```mermaid
sequenceDiagram
    participant J as Reconciliation Job
    participant DB as Movie PostgreSQL
    participant S as Meilisearch

    J->>J: from = lastSuccess - overlap
    J->>J: to = jobStartedAt
    J->>DB: Query updated movies in window
    DB-->>J: Changed movies
    J->>S: Idempotent upserts
    alt all successful
        S-->>J: Success
        J->>J: lastSuccess = to
    else failure
        J->>J: Keep old checkpoint
        J->>J: Retry later
    end
```
