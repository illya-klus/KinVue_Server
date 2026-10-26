# KinVue — High-Level Architecture v1

## Traffic separation

KinVue has three major external traffic paths.

```mermaid
flowchart LR
    C[Clients]

    C -->|HTTP / REST| GLB[Gateway Load Balancer]
    GLB --> G1[Gateway]
    GLB --> G2[Gateway]
    GLB --> G3[Gateway]

    C -->|WebSocket + JWT| RLB[Rooms Load Balancer]
    RLB --> R1[Rooms #1]
    RLB --> R2[Rooms #2]
    RLB --> R3[Rooms #3]

    C -->|Signed media access| CDN[CDN]
    CDN -->|Origin fetch on cache miss| S3[(S3 / Object Storage)]
```

### API traffic

`Client -> Gateway LB -> Gateway cluster -> services`

Used for:

- auth endpoints;
- user/profile/social APIs;
- movie metadata/search APIs;
- room control APIs such as create/invite.

### Realtime traffic

`Client <-> Rooms LB <-> Rooms cluster`

Used for:

- play;
- pause;
- seek;
- chat;
- reactions;
- presence;
- room realtime events.

The Gateway is intentionally not in the long-lived WebSocket data path.

### Media traffic

`Client <- CDN <- S3`

Video bytes do not pass through Gateway or Movie Service.

---

## Main services

```mermaid
flowchart LR
    C[Clients]

    C --> GLB[Gateway LB]
    GLB --> G[Gateway Cluster]

    G --> A[Auth Service]
    G --> U[Users Service]
    G --> M[Movie Service]
    G --> RCTRL[Rooms HTTP Control]

    C -->|WebSocket| RLB[Rooms LB]
    RLB --> RC[Rooms Cluster]

    A --> APG[(Auth PostgreSQL)]
    U --> MDB[(MongoDB)]

    RC --> REDIS[(Redis HA\nRoom State + Pub/Sub + Chat TTL)]

    M --> MPG[(Movie PostgreSQL)]
    M --> MEILI[(Meilisearch)]

    U --> RMQ[RabbitMQ]
    RC --> RMQ
    RMQ --> N[Notifications Service]

    C --> CDN[CDN]
    CDN --> S3[(S3)]

    ADMIN[Admin] -->|Direct multipart upload| S3
    S3 --> TQ[Transcode Queue]
    TQ --> TW[Transcode Workers]
    TW --> S3
```

## Key responsibilities

### Gateway

- HTTP edge.
- JWT validation for API requests.
- Routing.
- Rate limiting.
- Request context.
- Potential API composition.
- Stateless and horizontally scalable.

### Auth

- Credentials.
- Identity.
- Access/refresh token lifecycle.
- Registration orchestration.
- Source of truth for identity/credentials.

### Users

- User profiles.
- Preferences.
- Friendships.
- Social/user-related data.
- Source of truth for profile/social data.

### Rooms

- Ephemeral room lifecycle.
- Membership/presence.
- Room permissions.
- Playback synchronization.
- Realtime chat/reactions.
- Reconnect/resync.

### Movie

- Movie metadata.
- Publish lifecycle.
- Search integration.
- Media identifiers/keys.
- Access control for media.
- Source of truth: PostgreSQL.

### Notifications

- Consumes notification-worthy domain events.
- Sends push/in-app notifications according to future channel design.
- Uses at-least-once processing semantics.

### Media pipeline

- Admin uploads directly to S3.
- Queue decouples upload completion from expensive transcoding.
- Workers generate HLS outputs.
- CDN serves processed media.

---

## High-level architectural rule

The HLA is intentionally frozen at v1.

More detail should be added only when:

- a service is being designed in depth;
- a failure scenario proves a missing component;
- a load test proves a scaling problem;
- a new requirement creates a new bounded context.
