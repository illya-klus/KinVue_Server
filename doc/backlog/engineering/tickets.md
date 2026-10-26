# KinVue ticket backlog

Local engineering tickets for later import into Jira or Linear. No external board was updated.

Second pass: every numbered spec (`00`–`28`), `manifest.json`, and all 148 `scripts/issue-desc` files were read before this update. Those issue files are a mis-keyed copy of `28_JIRA_BACKLOG.md` and do not add behavior beyond documents `00`–`27`. Ticket scope was not expanded from them.

Every product ticket is **Missing**. The repository contains the documentation pack and Jira-import scripts only. There is no `apps/` implementation to mark done.

Effort is focused engineering time for one engineer who already knows the cited document. It is not calendar time. Totals carry about ±35% uncertainty because several behavior-shaping decisions are still open and no implementation exists to measure against.

- Tickets: 308
- Epics: 39
- Features: 101
- Estimated effort: 775 hours
- MVP tickets: 307 (772 hours)
- Post-MVP tickets: 1 (3 hours)

## E-00 — Decision gates

Close the behavior-shaping choices that the architecture pack leaves open and that the implementation plan proposes without updating the decision log.

### F-00-01 — Stack, layout, and ports

Record whether the implementation plan's stack and repository layout are accepted.

### T-0001 — Accept the v1 stack, repository layout, and port map

- **Epic:** E-00 Decision gates
- **Feature:** F-00-01 Stack, layout, and ports
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** cross-cutting
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Chosen implementation stack, Target Repository Structure, Port Map; 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md Infrastructure

Decide whether KinVue v1 will use the implementation plan's TypeScript monorepo, Node.js 20, pnpm, Turborepo, NestJS-style HTTP services, React/Vite web client, and the published port map.

**Deliverable:** A decision-log entry that accepts or replaces the stack, layout, and ports.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The entry names the accepted language, package manager, service framework, and web framework
- The entry either accepts apps/gateway, auth-service, users-service, movie-service, rooms-service, notifications-service, transcode-worker, and apps/web, or records the replacement
- Ports 3000, 4000-4005, 4014, 5433, 5434, 27017, 6379, 5672, 15672, 7700, 9000, 9001, 9090, and 3001 are accepted or replaced
- No application code is started before this entry exists

**Verification:** Reviewer can point at the decision-log paragraph and the unchanged port table.

**Testing:** No runtime test. The ticket is a written decision.

**Implementation notes:** Docs 00-26 do not choose NestJS, React, or pnpm. Those choices exist only in the implementation plan.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-02 — Auth and registration policy

Record token, hashing, and registration compensation choices that the architecture pack still lists as deferred.

### T-0002 — Accept access-token and refresh-token lifetimes and rotation

- **Epic:** E-00 Decision gates
- **Feature:** F-00-02 Auth and registration policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-02; FR-03
- **Source:** 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md Auth; 22_SECURITY_MODEL.md Auth tokens; 27 fixed decisions

Accept or replace the proposed 15-minute access token, 30-day refresh token, and rotate-on-refresh policy.

**Deliverable:** Decision-log entry for access TTL, refresh TTL, rotation, and revocation.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Access-token lifetime is an explicit duration
- Refresh-token lifetime is an explicit duration
- The entry says whether every refresh revokes the previous refresh token
- The open-questions list no longer treats these three items as undecided

**Verification:** Compare the entry with 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md Auth section.

**Testing:** No runtime test.

**Implementation notes:** Proposed default from the implementation plan: 15 minutes, 30 days, rotate and revoke.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0003 — Accept RS256 signing and a local JWKS endpoint

- **Epic:** E-00 Decision gates
- **Feature:** F-00-02 Auth and registration policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-03
- **Source:** ADR-003; 06_AUTH_AND_REGISTRATION.md JWT model; 18 Auth key rotation; 27 fixed decisions

Accept RS256 with a JWKS document served by Auth, or record a different local-verification mechanism.

**Deliverable:** Decision-log entry for algorithm, key publication, and kid lookup.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The signing algorithm is named
- Gateway and Rooms can fetch verification keys without a token introspection call
- Key id behavior for an unknown kid is stated
- Full key-rotation ceremony can stay deferred if the entry says so

**Verification:** Entry is consistent with ADR-003 local validation.

**Testing:** No runtime test.

**Implementation notes:** Proposed default: RS256 and GET /.well-known/jwks.json.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0004 — Accept Argon2id and record its parameters

- **Epic:** E-00 Decision gates
- **Feature:** F-00-02 Auth and registration policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** —
- **Source:** 22_SECURITY_MODEL.md password hashing parameters; 27 fixed decisions

Choose the password hash algorithm and the memory, time, and parallelism parameters.

**Deliverable:** Decision-log entry naming the algorithm and parameters.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Algorithm is Argon2id or an explicitly justified replacement
- Memory, iterations, and parallelism are numbers, not an adjective
- The entry cites the guidance used to pick the numbers
- Parameters are not committed as application secrets

**Verification:** A second engineer can configure the hasher from the entry alone.

**Testing:** No runtime test.

**Implementation notes:** Do not treat any specific Argon2 cost as already required. The security model defers the numbers. G-11.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0005 — Decide how registration compensation treats the email

- **Epic:** E-00 Decision gates
- **Feature:** F-00-02 Auth and registration policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md Registration Saga; 27 Phase 8 steps 8.14-8.15; G-09

Resolve whether a failed registration deletes the PENDING identity, keeps COMPENSATED, or keeps the row while releasing the unique email.

**Deliverable:** Decision-log entry for compensation and a later retry by the same email.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The entry picks one of delete, retain, or retain-and-release-email
- It states the HTTP status returned to the client
- It states whether the same email can register after compensation
- Login remains impossible until status is ACTIVE

**Verification:** The entry quotes the conflicting sentences it resolves.

**Testing:** No runtime test.

**Implementation notes:** Proposal: keep an audit row, release the email, return 503, and never return 201.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0022 — Choose browser refresh-token storage

- **Epic:** E-00 Decision gates
- **Feature:** F-00-02 Auth and registration policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-02
- **Source:** 27 Phase 11 step 11.4; G-08

Pick in-memory JSON for local development, HTTP-only cookie for deployed environments, or one mechanism for both.

**Deliverable:** Decision-log entry for the refresh transport.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Local and deployed behavior are both specified
- Access tokens are not placed in localStorage in the accepted design
- Logout clears the chosen storage

**Verification:** Web session ticket matches the entry.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-03 — Users and social policy

Record username, search, and watchlist ownership choices.

### T-0006 — Accept username uniqueness and character rules

- **Epic:** E-00 Decision gates
- **Feature:** F-00-03 Users and social policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-01
- **Source:** 18 Users username uniqueness; 27 fixed decisions

Accept or replace the proposed username rule: unique, lowercase, 3-30 characters, letters, numbers, underscore, and dot.

**Deliverable:** Decision-log entry for username normalization and uniqueness.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Allowed alphabet and length are explicit
- Uniqueness is case-insensitive
- The entry says whether a user can change username later; the current pack does not require change

**Verification:** Profile and registration tickets can cite the entry.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0007 — Accept v1 user search and friendship pagination

- **Epic:** E-00 Decision gates
- **Feature:** F-00-03 Users and social policy
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-05; FR-08
- **Source:** 18 Users user search and friendship pagination; 27 fixed decisions

Accept MongoDB text or regex search on username and display name, a minimum query of 2 characters, and cursor pagination on createdAt plus id.

**Deliverable:** Decision-log entry for user search and friend-list pagination.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Search fields and minimum length are stated
- Cursor fields are stated
- Graph queries and mutual friends remain out of scope

**Verification:** Entry matches the deferred list in document 18.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0008 — Accept which service owns watchlist rows

- **Epic:** E-00 Decision gates
- **Feature:** F-00-03 Users and social policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-11
- **Source:** 07_USERS_AND_SOCIAL_GRAPH.md Data duplication; 27 fixed decisions watchlist ownership

Decide that Movie Service stores watchlist rows, or assign them to Users instead.

**Deliverable:** Decision-log entry naming the owning service and the stored columns.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Owning service is named
- Stored fields are userId, movieId, and createdAt, unless the entry adds fields
- The entry does not turn the optional watch-history projection into a requirement

**Verification:** Schema ticket cites this entry.

**Testing:** No runtime test.

**Implementation notes:** Proposal from the plan: Movie PostgreSQL. The users document only shows an optional hot-read projection.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-04 — Rooms, presence, and playback policy

Record TTLs, heartbeat, permissions, and the durable-event store for a service that otherwise has no database.

### T-0009 — Accept room, close, and chat TTL values

- **Epic:** E-00 Decision gates
- **Feature:** F-00-04 Rooms, presence, and playback policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-13; NFR-14
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md; 18 Rooms and Chat; 27 fixed decisions

Accept or replace the 6-hour inactivity TTL, 15-minute retention after close, and 24-hour chat TTL that is deleted when the room is cleaned up.

**Deliverable:** Decision-log entry for the three TTL values and whether chat survives close.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Each TTL is a duration
- The entry answers whether chat survives room closure
- Durable chat history remains out of scope

**Verification:** Redis key ticket uses these durations.

**Testing:** No runtime test.

**Implementation notes:** Proposal: 6 hours, 15 minutes after close, chat deleted with the room. G-related open question in document 18.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0010 — Accept presence, heartbeat, capacity, and room roles

- **Epic:** E-00 Decision gates
- **Feature:** F-00-04 Rooms, presence, and playback policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-02; FR-29; FR-30
- **Source:** 02_REQUIREMENTS.md NFR-02 FR-29 FR-30; 03_CAPACITY_ESTIMATION.md heartbeat; 18 Rooms; 27 fixed decisions; G-10

Accept roles OWNER, CONTROLLER, and VIEWER, capacity 20, presence ONLINE, DISCONNECTED, and LEFT, and the heartbeat timing.

**Deliverable:** Decision-log entry that also reconciles the 30-second heartbeat with the capacity model's 0.1/sec assumption.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The three roles and the default role for an invitee are stated
- Capacity is 20 or a replacement number
- Heartbeat interval and stale threshold are stated
- The capacity document's 0.1/sec figure is labeled as a model, not the client contract, if 30 seconds is accepted

**Verification:** Presence and permission tickets cite one interval.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0011 — Accept monotonic playback versions for v1

- **Epic:** E-00 Decision gates
- **Feature:** F-00-04 Rooms, presence, and playback policy
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-09; NFR-10
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md Concurrent control races; 18 room-state version numbers; 27 fixed decisions

Decide whether v1 stores a monotonic version and clients ignore older versions, while still allowing last processed state to win.

**Deliverable:** Decision-log entry for version handling.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The entry says versions are in or out of v1
- It preserves last-processed-wins as the business rule
- It does not add distributed locks or consensus

**Verification:** Playback command ticket matches the entry.

**Testing:** No runtime test.

**Implementation notes:** The architecture allows skipping versions. The plan proposes implementing them anyway.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0012 — Decide where durable room events are stored

- **Epic:** E-00 Decision gates
- **Feature:** F-00-04 Rooms, presence, and playback policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** M
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-27; NFR-12
- **Source:** ADR-005; ADR-019; 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; G-04

Choose a durable outbox location for ROOM_INVITED without pretending Redis Pub/Sub is that outbox.

**Deliverable:** Decision-log entry and, if a new store is accepted, a one-paragraph ADR addendum.

**Suggested files:** 16_ARCHITECTURE_DECISIONS.md; 17_DECISION_LOG.md

**Acceptance criteria**

- The entry names the database or explicitly accepts loss of invite events
- Ephemeral play, pause, seek, and reactions stay out of the outbox
- The choice does not introduce Kafka or a separate chat service

**Verification:** Invite event ticket names the same store.

**Testing:** No runtime test.

**Implementation notes:** Proposal: a Rooms-owned PostgreSQL table used only for durable outbox rows. Playback state remains in Redis.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0018 — Accept where scheduled watch rows are stored

- **Epic:** E-00 Decision gates
- **Feature:** F-00-04 Rooms, presence, and playback policy
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-36; FR-37
- **Source:** ADR-005; 27 Phase 25 step 25.2; C-07

Accept storing scheduled_rooms in Movie PostgreSQL, or assign that durable schedule to another database.

**Deliverable:** Decision-log entry naming the database and why Redis is not the schedule source of truth.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The store survives Redis loss
- The entry acknowledges the Rooms-has-no-PostgreSQL rule and the exception
- Invitee storage is required in the same decision, per G-05

**Verification:** Schedule schema ticket uses that store.

**Testing:** No runtime test.

**Implementation notes:** Proposal: Movie PostgreSQL plus a scheduled_room_invitees table.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-05 — Movie, search, and media policy

Record the movie state machine, search access, reconciliation cadence, and media pipeline choices.

### T-0013 — Separate or combine movie publication and media status

- **Epic:** E-00 Decision gates
- **Feature:** F-00-05 Movie, search, and media policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** M
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-14; FR-15
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md Movie lifecycle; 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md; 23_DATA_MODELS_DRAFT.md; G-06

Choose one status column or two fields so a movie can be scheduled while its media is still processing.

**Deliverable:** A state diagram in the decision log covering draft, schedule, upload, process, ready, published, and failure states.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Every status named in documents 09, 10, and 23 appears on the diagram or is explicitly dropped
- The diagram shows which states may be searched
- The diagram shows which states may authorize playback
- Illegal transitions are listed

**Verification:** Schema and publish tickets implement that diagram rather than an undocumented merge.

**Testing:** No runtime test.

**Implementation notes:** Proposal: publication_status and media_status. The plan's single column is the alternative, not a confirmed requirement.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0014 — Decide whether published movie reads are anonymous

- **Epic:** E-00 Decision gates
- **Feature:** F-00-05 Movie, search, and media policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-10
- **Source:** 22_SECURITY_MODEL.md API; 27 Phase 10 step 10.2; G-07

Decide if GET /movies/search and GET /movies/:movieId require a JWT.

**Deliverable:** Decision-log entry for anonymous catalog reads.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Search and detail are each marked anonymous or authenticated
- Watchlist, media access, and admin routes stay authenticated regardless
- The security model sentence that conflicts is updated in the same entry

**Verification:** Gateway public-route ticket matches the entry.

**Testing:** No runtime test.

**Implementation notes:** Proposal: anonymous reads of published movies only.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0015 — Accept search debounce, minimum length, and no result cache

- **Epic:** E-00 Decision gates
- **Feature:** F-00-05 Movie, search, and media policy
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-10; NFR-06
- **Source:** ADR-008; 09_MOVIE_SEARCH_AND_INDEXING.md; 27 fixed decisions

Confirm 300 ms debounce, a minimum query length of 2, and no Redis search-result cache in v1.

**Deliverable:** Decision-log confirmation. Debounce of 300 ms is already the example in document 09. Minimum length was optional and is proposed as 2.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Debounce duration is stated
- Minimum length is stated
- Search-result caching is explicitly deferred
- Horizontal Meilisearch is not approved by this ticket

**Verification:** Web search ticket uses the same numbers.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0016 — Accept search reconciliation cadence and overlap

- **Epic:** E-00 Decision gates
- **Feature:** F-00-05 Movie, search, and media policy
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-08
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md; ADR-020; 18 Movies cron interval; 27 fixed decisions

Accept a 5-minute incremental sync with 24-hour overlap, a 60-second scheduled-publish worker, and a manual full rebuild.

**Deliverable:** Decision-log entry for both job intervals and the overlap window.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Incremental interval, overlap, and publish-worker interval are durations
- Checkpoint movement remains forbidden until Meilisearch confirms success
- Full rebuild stays available

**Verification:** Reconciliation ticket cites the entry.

**Testing:** No runtime test.

**Implementation notes:** Document 18 leaves daily versus 5 or 15 minutes open. Five minutes is a proposal.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0017 — Accept HLS ladder, upload limits, and signed URL lifetime

- **Epic:** E-00 Decision gates
- **Feature:** F-00-05 Movie, search, and media policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-13; NFR-11
- **Source:** 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md; 18 Media; 27 fixed decisions

Accept HLS-only, the 1080p/720p/480p ladder, FFmpeg for MVP, three transcode attempts, 24-hour abandoned-upload cleanup, originals retained, and a 10-minute signed URL.

**Deliverable:** Decision-log entry for format, ladder, retries, cleanup, retention, and URL TTL.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- DASH and DRM are explicitly out of v1
- Bitrates match or replace 5 Mbps, 3 Mbps, and 1.5 Mbps
- Allowed upload content types and the 1 MB to 25 GB size window are accepted or replaced
- Signed URL TTL is a duration

**Verification:** Upload and transcode tickets use the same numbers.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-06 — Notifications, admin, and invite policy

Record how admin authority is granted, how invite URLs work, and what v1 notifications actually deliver.

### T-0019 — Accept v1 notification channels and dedup store

- **Epic:** E-00 Decision gates
- **Feature:** F-00-06 Notifications, admin, and invite policy
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-12
- **Source:** 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; 18 Notifications; 27 fixed decisions

Accept in-app notifications stored in PostgreSQL, a logged fake push provider, dedup by eventId, two retries, and a DLQ replay CLI.

**Deliverable:** Decision-log entry that leaves a real push vendor deferred.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- In-app storage is in or out
- Real device push is explicitly deferred or a vendor is named
- Dedup store is not the Rooms Redis
- Retry count remains 2 unless the entry changes ADR-018

**Verification:** Consumer ticket matches the entry.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0020 — Decide how the first admin scope is granted

- **Epic:** E-00 Decision gates
- **Feature:** F-00-06 Notifications, admin, and invite policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** M
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-12
- **Source:** 22_SECURITY_MODEL.md admin authorization; 27 admin scope; G-02

Choose how a user receives the admin scope. The pack requires the scope and does not specify provisioning.

**Deliverable:** Decision-log entry and a short operator procedure.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The mechanism is seed command, database update, or another named method
- Ordinary registration does not grant admin
- The scope appears in the access token
- No public self-serve admin signup is introduced

**Verification:** Admin seed ticket implements only the chosen mechanism.

**Testing:** No runtime test.

**Implementation notes:** Proposal: an operator CLI that sets scopes on an existing ACTIVE identity.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0021 — Define the private-room invite URL

- **Epic:** E-00 Decision gates
- **Feature:** F-00-06 Notifications, admin, and invite policy
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** M
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-28
- **Source:** 02_REQUIREMENTS.md FR-28; 27 Phase 20 step 20.8; G-03

Specify what an invite URL contains and how it authorizes a private-room join.

**Deliverable:** Decision-log entry with the URL shape, storage, expiry, and join rule.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The URL is not defined as a guessable room id if the room is private
- Expiry matches the room lifetime or a shorter stated duration
- Opening the URL while unauthenticated sends the person to login and then returns
- In-app user-id invites remain a separate path for FR-27

**Verification:** Invite-token tickets cite the entry.

**Testing:** No runtime test.

**Implementation notes:** Proposal: unguessable token stored with the room, default role VIEWER.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-00-07 — Deployment and explicit non-goals

Record the MVP hosting class and the capabilities that v1 must not build.

### T-0023 — Defer FR-09 activity until the product names it

- **Epic:** E-00 Decision gates
- **Feature:** F-00-07 Deployment and explicit non-goals
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** cross-cutting
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** FR-09
- **Source:** 02_REQUIREMENTS.md FR-09; G-01

Record that no activity feed will be built until a product owner lists the activities, the audience, and the MVP decision.

**Deliverable:** Decision-log entry deferring FR-09 with the reason.

**Suggested files:** 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md

**Acceptance criteria**

- The entry quotes FR-09
- It states that no feed, watch history, or presence history is authorized by the current sentence
- It names the product decision required later

**Verification:** Backlog contains no activity-feed implementation ticket.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0024 — Record the MVP hosting class without choosing unused topology

- **Epic:** E-00 Decision gates
- **Feature:** F-00-07 Deployment and explicit non-goals
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** NFR-15; NFR-01
- **Source:** 24_SCALING_AND_DEPLOYMENT_STRATEGY.md; 18 Infrastructure; 27 Phase 32; G-14; C-09

Choose a hosting class that can stay near $300 per month and explicitly refuse to provision 100k-concurrent capacity for MVP.

**Deliverable:** A one-page hosting decision that names the class of compute, managed data services, object storage, and CDN without requiring Kubernetes.

**Suggested files:** docs/runbooks/deployment-decision.md

**Acceptance criteria**

- Monthly budget target remains <= $300
- 100k concurrent users remains an architecture model, not an MVP purchase
- Kubernetes, multi-CDN, and multi-region DR are out of this decision
- Redis is HA-capable in production and may be a single node locally

**Verification:** Provisioning tickets cite this page and do not name an unapproved vendor-specific product beyond what the page chooses.

**Testing:** No runtime test.

**Implementation notes:** Vendor selection can land in this same page when the operator chooses it. Until then, later tickets say managed PostgreSQL, MongoDB, Redis, AMQP, object storage, and CDN.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0025 — Record v1 non-goals so they are not implemented

- **Epic:** E-00 Decision gates
- **Feature:** F-00-07 Deployment and explicit non-goals
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 0 — Discovery and architecture
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** cross-cutting
- **MVP class:** MVP
- **Dependencies:** None
- **Requirements:** —
- **Source:** 17_DECISION_LOG.md Rejected; 27 What Not To Build In v1

Copy the rejected scope into the decision log as an implementation ban.

**Deliverable:** A non-goal list covering chat service, streaming service, Kafka, 2PC, graph database, durable chat, global DMs, recommendations, DRM, multi-CDN, horizontal search, and search-result cache.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- Each item from the implementation plan's What Not To Build section is listed
- The list says a load-test failure is required before horizontal search or a search cache is reconsidered
- No ticket in this backlog implements those items

**Verification:** Search the backlog for Kafka, DRM, and a Chat Service implementation and find none.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-01 — Workstation and repository bootstrap

Prepare a local toolchain and repository hygiene so application work can start.

### F-01-01 — Local toolchain

Install the tools named by the implementation plan.

### T-0026 — Install and verify Node.js 20 LTS

- **Epic:** E-01 Workstation and repository bootstrap
- **Feature:** F-01-01 Local toolchain
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Rejected (KIN-131, decision 0010 keeps Node 24)
- **Confidence:** Confirmed
- **Service / module:** workstation
- **MVP class:** MVP
- **Dependencies:** T-0001
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 0 steps 0.1 and 0.5

Install Node.js 20 LTS on the developer workstation and record the version command.

**Deliverable:** local-dev runbook section showing the accepted node version command.

**Suggested files:** docs/runbooks/local-dev.md

**Acceptance criteria**

- node --version prints a v20 release
- The runbook tells the next engineer how to install it

**Verification:** Run node --version.

**Testing:** Manual version check only.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0027 — Install and verify pnpm

- **Epic:** E-01 Workstation and repository bootstrap
- **Feature:** F-01-01 Local toolchain
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Rejected (KIN-135; pnpm 10.34.4 already recorded in 0001)
- **Confidence:** Proposed
- **Service / module:** workstation
- **MVP class:** MVP
- **Dependencies:** T-0026
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 0 step 0.2; packageManager pnpm@9.12.0

Install the pnpm version accepted with the stack decision.

**Deliverable:** Runbook section for pnpm.

**Suggested files:** docs/runbooks/local-dev.md

**Acceptance criteria**

- pnpm --version matches the accepted major version
- Install command is documented

**Verification:** Run pnpm --version.

**Testing:** Manual version check only.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0028 — Install and verify Docker

- **Epic:** E-01 Workstation and repository bootstrap
- **Feature:** F-01-01 Local toolchain
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Rejected (KIN-137; Docker Compose already runs local Postgres)
- **Confidence:** Confirmed
- **Service / module:** workstation
- **MVP class:** MVP
- **Dependencies:** T-0001
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 0 steps 0.3 and 0.5; 19_IMPLEMENTATION_PLAN.md Phase 1

Install Docker with Compose support for the local infrastructure.

**Deliverable:** Runbook section for Docker.

**Suggested files:** docs/runbooks/local-dev.md

**Acceptance criteria**

- docker --version succeeds
- docker compose version succeeds

**Verification:** Run both commands.

**Testing:** Manual version check only.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0029 — Install FFmpeg for local media checks

- **Epic:** E-01 Workstation and repository bootstrap
- **Feature:** F-01-01 Local toolchain
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Rejected (KIN-140, decision 0017: no host FFmpeg)
- **Confidence:** Proposed
- **Service / module:** workstation
- **MVP class:** MVP
- **Dependencies:** T-0017
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 0 step 0.4

Install FFmpeg so engineers can inspect fixture outputs outside the worker container.

**Deliverable:** Runbook section for FFmpeg.

**Suggested files:** docs/runbooks/local-dev.md

**Acceptance criteria**

- ffmpeg -version succeeds
- The worker image still installs its own FFmpeg rather than relying on the host

**Verification:** Run ffmpeg -version.

**Testing:** Manual version check only.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-01-02 — Repository hygiene

Ignore secrets and build output before application code starts.

### T-0030 — Add a root gitignore for secrets and build output

- **Epic:** E-01 Workstation and repository bootstrap
- **Feature:** F-01-02 Repository hygiene
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Done (KIN-144; root .gitignore)
- **Confidence:** Confirmed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0001
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 0 step 0.7; 22_SECURITY_MODEL.md secrets are not committed

Ignore dependencies, build output, coverage, env files, logs, uploads, and test reports.

**Deliverable:** A root .gitignore containing the plan's patterns.

**Suggested files:** .gitignore

**Acceptance criteria**

- node_modules, dist, coverage, .env, .env.*, and uploads are ignored
- .env.example is not ignored
- A sample secret file matching .env is not shown as a committable path by git status

**Verification:** git check-ignore -v .env

**Testing:** No application test.

**Implementation notes:** Initializing git and committing the docs pack is a repository action for the operator. This ticket only adds the ignore rules. Do not commit secrets.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-02 — Monorepo foundation

Create the TypeScript workspace layout fixed by the implementation plan.

### F-02-01 — Workspace and task runner

Create the pnpm workspace and Turborepo task graph.

### T-0031 — Create the root package manifest and workspace scripts

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-01 Workspace and task runner
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0027, T-0030
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 1 step 1.1

Add the private kinvue package with the documented dev, build, test, lint, typecheck, format, and infra scripts.

**Deliverable:** Root package.json matching the accepted package manager.

**Suggested files:** package.json

**Acceptance criteria**

- package name is private
- scripts include dev, build, test, test:e2e, lint, typecheck, format, infra:up, infra:down, and infra:logs
- pnpm install completes

**Verification:** pnpm install

**Testing:** Install succeeds with an empty workspace.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0032 — Declare the pnpm workspace globs

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-01 Workspace and task runner
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0031
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 1 step 1.2 and Target Repository Structure

Include apps, packages, and tests in the workspace and create those directories.

**Deliverable:** pnpm-workspace.yaml plus empty apps, packages, infra, tests, scripts, and docs/api directories.

**Suggested files:** pnpm-workspace.yaml

**Acceptance criteria**

- Globs cover apps/_, packages/_, and tests/*
- The directories exist and contain a keep file if git would otherwise drop them

**Verification:** pnpm list -r does not error.

**Testing:** No application test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0033 — Configure Turborepo task pipelines

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-01 Workspace and task runner
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0031
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 1 step 1.3

Configure build, dev, test, lint, and typecheck pipelines with the documented dependencies and outputs.

**Deliverable:** turbo.json.

**Suggested files:** turbo.json

**Acceptance criteria**

- build depends on upstream build
- dev is uncached and persistent
- test depends on upstream build

**Verification:** pnpm exec turbo run build --dry-run

**Testing:** Dry run only until packages exist.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-02-02 — TypeScript, format, and lint

Share strict TypeScript and formatting, and select a linter because the plan requires lint without naming one.

### T-0034 — Add the strict shared TypeScript config

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-02 TypeScript, format, and lint
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0031
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 1 step 1.4

Create a strict base tsconfig that service packages extend.

**Deliverable:** tsconfig.base.json with strict compiler options.

**Suggested files:** tsconfig.base.json

**Acceptance criteria**

- strict is enabled
- noImplicitOverride and exactOptionalPropertyTypes are considered and the chosen set is commented
- Services later extend this file rather than copying options

**Verification:** A temporary package typechecks against the base config.

**Testing:** Typecheck of a fixture file.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0035 — Add Prettier formatting

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-02 TypeScript, format, and lint
- **Priority:** P1
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0031
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 1 step 1.5

Add the documented Prettier rules and a format:check script for CI.

**Deliverable:** .prettierrc and a check script.

**Suggested files:** .prettierrc

**Acceptance criteria**

- single quotes, trailing commas, semicolons, and print width 100 are set
- pnpm exec prettier --check can run

**Verification:** prettier --check on the config files.

**Testing:** Format check only.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0036 — Choose and add the linter used by the lint script

- **Epic:** E-02 Monorepo foundation
- **Feature:** F-02-02 TypeScript, format, and lint
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Inferred
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0034, T-0032
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md root lint script and Phase 28 step 28.6. No linter is named.

Add ESLint with TypeScript support because the plan requires lint and does not name the tool.

**Deliverable:** A root ESLint flat config and per-package lint scripts.

**Suggested files:** eslint.config.js

**Acceptance criteria**

- pnpm lint runs through Turbo
- Unused variables and explicit any fail, or the exception is documented
- The choice is noted as inferred, not as an architecture decision

**Verification:** pnpm lint on the empty packages.

**Testing:** Lint a file with an intentional unused variable and confirm failure.

**Implementation notes:** If the stack decision replaces ESLint, implement that tool instead. Do not add a second linter.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-03 — Local infrastructure

Run Auth PostgreSQL, Movie PostgreSQL, Users MongoDB, Redis, RabbitMQ, Meilisearch, MinIO, Prometheus, and Grafana locally.

### F-03-01 — Relational and document stores

Run the two PostgreSQL databases and Users MongoDB.

### T-0037 — Create the Compose project and private network

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-01 Relational and document stores
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0028, T-0032
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 2 step 2.1; 22_SECURITY_MODEL.md internal network policies

Create the Compose file with a private network for data stores and an edge network placeholder for public ports.

**Deliverable:** infra/docker-compose.yml that starts no data services yet but validates.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- docker compose -f infra/docker-compose.yml config succeeds
- A named project and network exist in the file

**Verification:** docker compose config

**Testing:** Compose config validation.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0038 — Add Auth PostgreSQL on port 5433

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-01 Relational and document stores
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** FR-01
- **Source:** 04_HIGH_LEVEL_ARCHITECTURE.md Auth PostgreSQL; 12_DATA_OWNERSHIP_AND_CONSISTENCY.md; 27 Phase 2 step 2.2 and port map

Run auth-postgres for the Auth identity store, separate from the movie database.

**Deliverable:** Compose service auth-postgres with a healthcheck and a named volume.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- Host port is 5433
- Database name and user match the env example added later
- Container becomes healthy
- Movie data is not stored here

**Verification:** Connect with psql and select version().

**Testing:** Compose healthcheck.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0039 — Add Movie PostgreSQL on port 5434

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-01 Relational and document stores
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** —
- **Source:** ADR-007; 27 Phase 2 step 2.3

Run movie-postgres as the movie source of truth, separate from Auth.

**Deliverable:** Compose service movie-postgres with a healthcheck and a named volume.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- Host port is 5434
- It does not share a volume with Auth PostgreSQL
- Container becomes healthy

**Verification:** psql against port 5434.

**Testing:** Compose healthcheck.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Can be added in parallel with Auth PostgreSQL.

### T-0040 — Add Users MongoDB on port 27017

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-01 Relational and document stores
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** —
- **Source:** 07_USERS_AND_SOCIAL_GRAPH.md; 27 Phase 2 step 2.4

Run users-mongo for profiles and friendships.

**Deliverable:** Compose service users-mongo with a volume and healthcheck.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- Host port is 27017
- A kinvue_users database can be reached
- Container becomes healthy

**Verification:** mongosh ping.

**Testing:** Compose healthcheck.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-03-02 — Redis, RabbitMQ, and Meilisearch

Run the realtime, notification, and search dependencies.

### T-0041 — Add local Rooms Redis

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-02 Redis, RabbitMQ, and Meilisearch
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037, T-0024
- **Requirements:** —
- **Source:** ADR-004; 08_ROOMS_REALTIME_AND_CHAT.md Redis HA; 27 Phase 2 step 2.5

Run a single local Redis for room state and Pub/Sub. Do not claim this single node satisfies production HA.

**Deliverable:** Compose service rooms-redis on port 6379, plus a runbook note that production HA is a separate ticket.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- PING returns PONG
- The runbook says local Redis is not the production HA topology
- No Redis Cluster is added locally

**Verification:** redis-cli ping.

**Testing:** Compose healthcheck.

**Implementation notes:** Exact Sentinel versus Cluster remains deferred. G-14.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0042 — Add RabbitMQ with the management UI

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-02 Redis, RabbitMQ, and Meilisearch
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** —
- **Source:** 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; 27 Phase 2 step 2.6

Run RabbitMQ for notification and transcode queues.

**Deliverable:** Compose service with AMQP on 5672 and management on 15672.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- Management UI loads
- Default local credentials come from env, not from a committed secret beyond the documented local example
- AMQP port is reachable

**Verification:** Open http://localhost:15672 and list queues.

**Testing:** Compose healthcheck.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0043 — Add Meilisearch

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-02 Redis, RabbitMQ, and Meilisearch
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** —
- **Source:** ADR-007; 27 Phase 2 step 2.7

Run a single Meilisearch node for the rebuildable movie projection.

**Deliverable:** Compose service on port 7700.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- GET /health returns OK
- The master key is supplied by env
- No second search node is added

**Verification:** curl http://localhost:7700/health

**Testing:** HTTP health check.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-03-03 — Object storage

Run MinIO and create the media bucket.

### T-0044 — Add MinIO and create the kinvue-media bucket

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-03 Object storage
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037, T-0017
- **Requirements:** NFR-11
- **Source:** 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md; 27 Phase 2 steps 2.8-2.9

Run S3-compatible storage and initialize one bucket. Do not create extra buckets.

**Deliverable:** MinIO API on 9000, console on 9001, and an init job that creates kinvue-media.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- Bucket kinvue-media exists after startup
- The bucket is not world-readable
- Console loads
- One bucket is used with key prefixes, matching the HLA

**Verification:** List buckets with the MinIO client.

**Testing:** Init container exits successfully and a second start does not fail if the bucket exists.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-03-04 — Metrics stack and environment contract

Run Prometheus and Grafana and publish the local environment contract.

### T-0045 — Add Prometheus and Grafana containers

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-04 Metrics stack and environment contract
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0037
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md; 27 Phase 2 steps 2.10-2.11 and observability stack decision

Run Prometheus on 9090 and Grafana on 3001 for local metrics. Scrape jobs are added when services expose /metrics.

**Deliverable:** Both containers and an empty scrape config that validates.

**Suggested files:** infra/docker-compose.yml; infra/prometheus/prometheus.yml

**Acceptance criteria**

- Prometheus UI loads
- Grafana UI loads on 3001
- Grafana is not bound to the web app port 3000

**Verification:** Open both UIs.

**Testing:** Compose health or HTTP probe.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0046 — Publish the local environment example and port map

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-04 Metrics stack and environment contract
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0038, T-0039, T-0040, T-0041, T-0042, T-0043, T-0044
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 2 step 2.12 and Port Map

Document every local variable and port from the implementation plan without committing a real .env.

**Deliverable:** .env.example and a port table in the local-dev runbook.

**Suggested files:** .env.example; docs/runbooks/local-dev.md

**Acceptance criteria**

- Variables listed in Phase 2 step 2.12 are present
- JWT issuer kinvue-auth and audience kinvue are included
- Access TTL 900 seconds, refresh 30 days, and media URL 600 seconds are marked as defaults pending the decision tickets
- .env is gitignored

**Verification:** Diff .env.example against the plan's variable list.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0047 — Verify the local infrastructure stack is healthy

- **Epic:** E-03 Local infrastructure
- **Feature:** F-03-04 Metrics stack and environment contract
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0046, T-0045
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 2 steps 2.14-2.18

Start Compose and record the health checks for every data, search, queue, object, and metrics container.

**Deliverable:** A checklist in the runbook with the commands that passed.

**Suggested files:** docs/runbooks/local-dev.md

**Acceptance criteria**

- docker compose ps shows the data services healthy
- RabbitMQ UI, MinIO console, Meilisearch health, Prometheus, and Grafana were opened
- Failures and their fixes are noted in the runbook

**Verification:** Re-run the checklist from a clean volume only if the first run was not recorded.

**Testing:** Manual infrastructure smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-04 — Shared packages

Provide config, logging, errors, JWT verification, contracts, and test helpers used by every service.

### F-04-01 — Configuration

Fail startup when required environment variables are missing.

### T-0048 — Create the shared config package with Zod validation

- **Epic:** E-04 Shared packages
- **Feature:** F-04-01 Configuration
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** packages/config
- **MVP class:** MVP
- **Dependencies:** T-0034, T-0032, T-0046
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.1-3.3

Load environment variables and fail startup when a required value is missing or the wrong type.

**Deliverable:** A config loader and one schema module per service.

**Suggested files:** packages/config

**Acceptance criteria**

- Auth, Users, Movie, Rooms, Notifications, Gateway, transcode worker, and web each have a schema
- A missing required variable throws before the server listens
- Secrets are not printed when validation fails

**Verification:** Unit tests with fixture environments.

**Testing:** Unit tests for missing, invalid, and valid environments.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-04-02 — Logging

Emit structured JSON logs with the required correlation fields.

### T-0049 — Create the structured JSON logger

- **Epic:** E-04 Shared packages
- **Feature:** F-04-02 Logging
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** packages/logger
- **MVP class:** MVP
- **Dependencies:** T-0032
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.4-3.5; 21_OBSERVABILITY_AND_METRICS.md; 27 Phase 27 step 27.6

Emit JSON logs with service, requestId, userId, route, durationMs, and error fields.

**Deliverable:** Logger package that redacts passwords, hashes, access tokens, and refresh tokens.

**Suggested files:** packages/logger

**Acceptance criteria**

- Each required field is present when the caller supplies it
- A log line containing a password or bearer token is rewritten before output
- Output is one JSON object per line

**Verification:** Unit test captures stdout.

**Testing:** Unit tests for shape and redaction.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-04-03 — Errors

Use one error code set and HTTP mapping.

### T-0050 — Create the shared error codes and HTTP mapping

- **Epic:** E-04 Shared packages
- **Feature:** F-04-03 Errors
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** packages/errors
- **MVP class:** MVP
- **Dependencies:** T-0032
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.6-3.7

Define UNAUTHENTICATED, FORBIDDEN, VALIDATION_FAILED, NOT_FOUND, CONFLICT, RATE_LIMITED, UPSTREAM_UNAVAILABLE, and INTERNAL.

**Deliverable:** Error type plus HTTP status mapping and a JSON body shape.

**Suggested files:** packages/errors

**Acceptance criteria**

- The eight codes exist
- 401, 403, 400, 404, 409, 429, 503, and 500 are mapped respectively
- The body includes code and message and omits stack traces in production mode

**Verification:** Unit tests for every code.

**Testing:** Unit tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-04-04 — JWT verification

Verify RS256 access tokens locally from JWKS.

### T-0051 — Create the local RS256 JWT verification helper

- **Epic:** E-04 Shared packages
- **Feature:** F-04-04 JWT verification
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** packages/jwt
- **MVP class:** MVP
- **Dependencies:** T-0032, T-0003, T-0050
- **Requirements:** —
- **Source:** ADR-003; 06_AUTH_AND_REGISTRATION.md; 27 Phase 3 steps 3.8-3.9

Verify signature, expiration, issuer, audience, and scopes from a supplied JWKS key set.

**Deliverable:** A helper with no network call of its own.

**Suggested files:** packages/jwt

**Acceptance criteria**

- Expired, bad signature, wrong issuer, wrong audience, and missing scope fail with distinct reasons
- A valid token returns userId and scopes
- The helper does not call Auth

**Verification:** Unit tests using a generated key pair.

**Testing:** Unit tests for each failure and the success path.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-04-05 — Shared contracts

Share DTOs and domain event names across services.

### T-0052 — Define shared auth, user, movie, room, and notification contracts

- **Epic:** E-04 Shared packages
- **Feature:** F-04-05 Shared contracts
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** packages/contracts
- **MVP class:** MVP
- **Dependencies:** T-0050, T-0006, T-0013
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.10-3.11; 15_SEQUENCE_DIAGRAMS.md; 23_DATA_MODELS_DRAFT.md

Write the DTO and event names that later endpoints must implement, without implementing the endpoints.

**Deliverable:** TypeScript types and schema validators for the documented request bodies and event names.

**Suggested files:** packages/contracts

**Acceptance criteria**

- Registration, login, profile, friend request, movie create, schedule, upload init, room create, invite, and notification event shapes exist
- Event names include FRIEND_REQUEST_CREATED, FRIEND_REQUEST_ACCEPTED, and ROOM_INVITED
- Playback and chat event names from Phases 18 and 19 exist
- Types do not include a Chat Service or Streaming Service API

**Verification:** Package typecheck and a schema test for one valid and one invalid payload per family.

**Testing:** Contract schema unit tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-04-06 — Test helpers

Share database, Redis, and HTTP test utilities.

### T-0053 — Create shared test cleanup and HTTP helpers

- **Epic:** E-04 Shared packages
- **Feature:** F-04-06 Test helpers
- **Priority:** P1
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** packages/testing
- **MVP class:** MVP
- **Dependencies:** T-0047, T-0048
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.12-3.13

Provide helpers that reset PostgreSQL schemas, Mongo collections, and Redis keys between tests and that issue HTTP requests.

**Deliverable:** Testing package with cleanup helpers and fixture builders for a user and a movie.

**Suggested files:** packages/testing

**Acceptance criteria**

- Cleanup is limited to test databases and refuses to run when NODE_ENV is production
- Helpers can create a unique email and username
- Redis cleanup deletes only keys with the test prefix documented in the helper

**Verification:** A smoke test runs two cases without leaking rows.

**Testing:** Package self-test against local infrastructure.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0054 — Add unit tests for config, logger, errors, and JWT

- **Epic:** E-04 Shared packages
- **Feature:** F-04-06 Test helpers
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** packages
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0050, T-0051
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 3 steps 3.14-3.15

Cover the shared package failure cases named in the plan.

**Deliverable:** Passing package unit tests.

**Suggested files:** packages/config; packages/logger; packages/errors; packages/jwt

**Acceptance criteria**

- Config, redaction, every error code, and JWT failure cases are tested
- pnpm test and pnpm typecheck pass for these packages

**Verification:** pnpm --filter @kinvue/config --filter @kinvue/logger --filter @kinvue/errors --filter @kinvue/jwt test

**Testing:** The unit tests this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-05 — Service skeletons

Boot every application with health, readiness, metrics, shared errors, and a container image.

### F-05-01 — HTTP service skeletons

Boot Gateway, Auth, Users, Movie, Rooms HTTP, and Notifications.

### T-0055 — Boot the gateway service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/gateway
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the HTTP edge service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4000.

**Suggested files:** apps/gateway

**Acceptance criteria**

- The package lives at apps/gateway
- It listens on 4000
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4000.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0056 — Add live, ready, metrics, and error handling to gateway

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/gateway
- **MVP class:** MVP
- **Dependencies:** T-0055, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from gateway.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/gateway

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4000/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0058 — Boot the auth service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/auth-service
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the identity and tokens service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4001.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- The package lives at apps/auth-service
- It listens on 4001
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4001.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0059 — Add live, ready, metrics, and error handling to auth

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/auth-service
- **MVP class:** MVP
- **Dependencies:** T-0058, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from auth.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4001/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0061 — Boot the users service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/users-service
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the profiles and friendships service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4002.

**Suggested files:** apps/users-service

**Acceptance criteria**

- The package lives at apps/users-service
- It listens on 4002
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4002.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0062 — Add live, ready, metrics, and error handling to users

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/users-service
- **MVP class:** MVP
- **Dependencies:** T-0061, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from users.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/users-service

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4002/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0064 — Boot the movie service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/movie-service
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the catalog and media control service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4003.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- The package lives at apps/movie-service
- It listens on 4003
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4003.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0065 — Add live, ready, metrics, and error handling to movie

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/movie-service
- **MVP class:** MVP
- **Dependencies:** T-0064, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from movie.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4003/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0067 — Boot the rooms service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the room HTTP control service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4004.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- The package lives at apps/rooms-service
- It listens on 4004
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4004.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0068 — Add live, ready, metrics, and error handling to rooms

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0067, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from rooms.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4004/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0070 — Boot the notifications service process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049, T-0033
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4; port map

Create the notification consumer service package so it starts and loads its config.

**Deliverable:** A process that listens on port 4005.

**Suggested files:** apps/notifications-service

**Acceptance criteria**

- The package lives at apps/notifications-service
- It listens on 4005
- Startup logs the service name and omits secrets
- It uses the shared config schema

**Verification:** Start the process and confirm it is listening on 4005.

**Testing:** A boot test that the process reaches listening state with test config.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0071 — Add live, ready, metrics, and error handling to notifications

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-01 HTTP service skeletons
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0070, T-0050
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.8-4.13

Expose health and metrics and return the shared JSON error shape from notifications.

**Deliverable:** GET /health/live, GET /health/ready, and GET /metrics.

**Suggested files:** apps/notifications-service

**Acceptance criteria**

- Live returns 200 when the process is up
- Ready returns 503 when the service's own dependency configured for this skeleton is unreachable, and 200 when it is reachable
- Metrics returns Prometheus text
- A thrown not-found error returns the shared JSON body
- The package has build, lint, typecheck, and test scripts

**Verification:** curl http://localhost:4005/health/live and /metrics.

**Testing:** HTTP tests for live, ready failure, and error shape.

**Implementation notes:** Readiness checking the service's own database or broker is inferred from the word ready. Do not make ready depend on unrelated services.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-05-02 — Realtime and worker skeletons

Boot the Rooms WebSocket port and the transcode worker.

### T-0073 — Reserve the Rooms WebSocket port

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-02 Realtime and worker skeletons
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** apps/rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0067
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md port map rooms-service websocket 4014; ADR-002

Listen for WebSocket upgrades on port 4014 without implementing room rules yet.

**Deliverable:** A socket server that accepts a connection and closes it with a not-implemented status until the handshake ticket lands.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- Port 4014 accepts an upgrade
- HTTP control remains on 4004
- The Gateway process is not on this path

**Verification:** Open a WebSocket to ws://localhost:4014/rooms and observe the placeholder close.

**Testing:** Connection test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0074 — Boot the transcode worker process

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-02 Realtime and worker skeletons
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0048, T-0049
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.7

Create the worker package with a health endpoint and a queue consumer that does not yet transcode.

**Deliverable:** A worker process that starts, exposes health, and logs that it is waiting for jobs.

**Suggested files:** apps/transcode-worker

**Acceptance criteria**

- GET /health/live returns 200
- It does not expose a public upload API
- Dockerfile includes a later hook for FFmpeg

**Verification:** Start the worker with local config.

**Testing:** Boot test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-05-03 — Container integration

Build images and run the service processes with local infrastructure.

### T-0057 — Add a Dockerfile for gateway

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/gateway
- **MVP class:** MVP
- **Dependencies:** T-0055
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for gateway that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/gateway/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0060 — Add a Dockerfile for auth

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/auth-service
- **MVP class:** MVP
- **Dependencies:** T-0058
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for auth that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/auth-service/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0063 — Add a Dockerfile for users

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/users-service
- **MVP class:** MVP
- **Dependencies:** T-0061
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for users that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/users-service/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0066 — Add a Dockerfile for movie

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/movie-service
- **MVP class:** MVP
- **Dependencies:** T-0064
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for movie that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/movie-service/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0069 — Add a Dockerfile for rooms

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0067
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for rooms that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/rooms-service/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0072 — Add a Dockerfile for notifications

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0070
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14

Build a production-shaped image for notifications that runs as a non-root user.

**Deliverable:** A Dockerfile that builds from the workspace.

**Suggested files:** apps/notifications-service/Dockerfile

**Acceptance criteria**

- Image builds
- Container starts and answers /health/live
- The image does not copy .env

**Verification:** docker build and a one-shot container curl.

**Testing:** Image smoke test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0075 — Add the transcode worker Dockerfile

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** apps/transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0074, T-0029
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 step 4.14; Phase 23 FFmpeg

Build a worker image that contains FFmpeg.

**Deliverable:** Dockerfile whose container can run ffmpeg -version.

**Suggested files:** apps/transcode-worker/Dockerfile

**Acceptance criteria**

- ffmpeg -version works inside the image
- The image does not contain cloud credentials

**Verification:** docker run --entrypoint ffmpeg <image> -version

**Testing:** Image command check.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0076 — Run all service images from Compose

- **Epic:** E-05 Service skeletons
- **Feature:** F-05-03 Container integration
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 1 — Foundation
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0047, T-0057, T-0060, T-0063, T-0066, T-0069, T-0072, T-0075
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 4 steps 4.15-4.17

Add every service to Compose and confirm live health on ports 4000 through 4005.

**Deliverable:** Compose services for all apps plus a recorded health check.

**Suggested files:** infra/docker-compose.yml

**Acceptance criteria**

- curl succeeds for /health/live on 4000, 4001, 4002, 4003, 4004, and 4005
- Services use env from .env.example names
- Internal services are not published except their documented host ports for local development

**Verification:** The six curl commands from Phase 4 step 4.17.

**Testing:** Compose smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-06 — Auth data model

Persist identity, refresh sessions, and a future Auth outbox in Auth PostgreSQL.

### F-06-01 — Identity schema

Store credentials and registration status with a unique email.

### T-0077 — Add Auth PostgreSQL migration tooling

- **Epic:** E-06 Auth data model
- **Feature:** F-06-01 Identity schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0058, T-0038
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 5 step 5.1

Add a SQL migration runner for Auth and a command that applies pending migrations.

**Deliverable:** Migration command documented in the Auth package scripts.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- The runner applies files in order
- It records applied versions
- It refuses to run against a URL that is not the Auth database

**Verification:** Run the command against an empty test database.

**Testing:** Migration runner test.

**Implementation notes:** The plan allows Prisma or SQL migrations. Pick one in this ticket and use the same style later for Movie. SQL files are the proposal.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0078 — Create the auth_identities table and email uniqueness

- **Epic:** E-06 Auth data model
- **Feature:** F-06-01 Identity schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0077, T-0005
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md Unique email; 23_DATA_MODELS_DRAFT.md Auth identity; 27 Phase 5 steps 5.2-5.3

Store user id, email, password hash, status, and timestamps.

**Deliverable:** Migration for auth_identities.

**Suggested files:** apps/auth-service/migrations

**Acceptance criteria**

- user_id is the primary key and is not updated by a later migration in this ticket
- email has a unique constraint
- status allows the values accepted in the compensation and registration decisions, including PENDING, PROFILE_CREATING, ACTIVE, COMPENSATING, COMPENSATED, and DISABLED
- A second insert with the same email fails

**Verification:** Apply the migration and attempt a duplicate email.

**Testing:** Migration test on an empty database.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-06-02 — Session and outbox schema

Store refresh sessions and an Auth outbox table for later durable Auth events.

### T-0079 — Create the refresh_sessions table

- **Epic:** E-06 Auth data model
- **Feature:** F-06-02 Session and outbox schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0078, T-0002
- **Requirements:** FR-02; FR-03
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 5 step 5.4-5.6; 22_SECURITY_MODEL.md refresh token

Store hashed refresh tokens, rotation parent, revocation, and expiry.

**Deliverable:** refresh_sessions migration and indexes on user_id and expires_at.

**Suggested files:** apps/auth-service/migrations

**Acceptance criteria**

- token_hash is unique
- The raw refresh token is not a column
- revoked_at and expires_at exist
- rotated_from_session_id is nullable

**Verification:** Migration test inserts one session and rejects a duplicate hash.

**Testing:** Migration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0080 — Create the auth_outbox_events table

- **Epic:** E-06 Auth data model
- **Feature:** F-06-02 Session and outbox schema
- **Priority:** P2
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0077
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 5 step 5.5; ADR-019

Add the outbox table for future durable Auth events. Do not invent an Auth event that the pack does not name.

**Deliverable:** auth_outbox_events migration and a status index.

**Suggested files:** apps/auth-service/migrations

**Acceptance criteria**

- Columns match event_id, type, payload, status, created_at, published_at, and retry_count
- No publisher is added in this ticket
- Status defaults to PENDING

**Verification:** Migration applies on an empty database.

**Testing:** Migration test.

**Implementation notes:** The plan says this table is for future events. Publishing from it is not a v1 requirement.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0081 — Test that Auth migrations apply to an empty database

- **Epic:** E-06 Auth data model
- **Feature:** F-06-02 Session and outbox schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0078, T-0079, T-0080
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 5 steps 5.7-5.8

Automate applying the Auth schema and checking the constraints.

**Deliverable:** A migration test and a local apply command.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- Test creates a fresh database, migrates, and asserts unique email
- The command works against local port 5433

**Verification:** Run the Auth migration test.

**Testing:** The migration test itself.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-07 — Auth token lifecycle

Implement password hashing, RS256 signing, login, refresh rotation, and logout.

### F-07-01 — Password hashing and signing keys

Hash passwords and publish the public verification key.

### T-0082 — Implement password hashing with the accepted Argon2id parameters

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-01 Password hashing and signing keys
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0004, T-0058
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 step 8.1; 22_SECURITY_MODEL.md

Hash and verify passwords using the parameters recorded by the hashing decision.

**Deliverable:** Hash and verify functions.

**Suggested files:** apps/auth-service/src/password

**Acceptance criteria**

- Verify succeeds for the same password
- Verify fails for a different password
- Hashes are not logged
- Parameters come from config or the decision record, not a magic number hidden in a route

**Verification:** Unit tests.

**Testing:** Unit tests for success, failure, and parameter presence.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0083 — Load the RS256 private key and publish JWKS

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-01 Password hashing and signing keys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0003, T-0059, T-0082
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 steps 8.2-8.4; 15_SEQUENCE_DIAGRAMS.md does not show JWKS but Gateway local validation requires it

Read the signing key from the environment and expose public keys at GET /.well-known/jwks.json.

**Deliverable:** JWKS endpoint and a local key-generation note for development.

**Suggested files:** apps/auth-service/src/keys

**Acceptance criteria**

- Private key is never returned by the endpoint
- The document includes kid, kty, and alg
- Missing key fails startup
- Development key generation instructions do not commit a private key

**Verification:** Fetch JWKS and confirm the private key is absent.

**Testing:** HTTP test for the document shape and a startup test for a missing key.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-07-02 — Login

Issue access and refresh tokens to ACTIVE identities.

### T-0084 — Mint access tokens with the required claims

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-02 Login
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0083, T-0002, T-0052
- **Requirements:** FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 step 8.20; 06_AUTH_AND_REGISTRATION.md

Sign access tokens that include sub, iss, aud, iat, exp, userId, and scopes.

**Deliverable:** Access-token mint function.

**Suggested files:** apps/auth-service/src/tokens

**Acceptance criteria**

- All listed claims are present
- exp matches the accepted access TTL
- iss is kinvue-auth and aud is kinvue unless the decision changed them
- userId equals sub

**Verification:** Unit test decodes a token with the public key.

**Testing:** Unit test for claims and expiry.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0085 — Issue and store hashed refresh sessions

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-02 Login
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0079, T-0082
- **Requirements:** FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 steps 8.19 and 8.22; 22_SECURITY_MODEL.md

Create an opaque refresh token, store only its hash, and set expiry from the accepted TTL.

**Deliverable:** Refresh session repository.

**Suggested files:** apps/auth-service/src/tokens

**Acceptance criteria**

- Database column contains a hash, not the token returned to the client
- Expiry matches the accepted refresh TTL
- Lookup by hash finds the session

**Verification:** Repository unit or integration test.

**Testing:** Integration test against Auth PostgreSQL.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0086 — Implement POST /auth/login for ACTIVE identities

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-02 Login
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0084, T-0085, T-0078
- **Requirements:** FR-02
- **Source:** 15_SEQUENCE_DIAGRAMS.md §1; 27 Phase 8 steps 8.17-8.19

Validate email and password and return both tokens only for ACTIVE identities.

**Deliverable:** POST /auth/login.

**Suggested files:** apps/auth-service/src/login

**Acceptance criteria**

- Valid ACTIVE credentials return 200 with access and refresh tokens
- Unknown email and wrong password return the same 401
- PENDING, COMPENSATED, and DISABLED identities return 401
- The handler does not call Users or Movie

**Verification:** Integration test with seeded identities.

**Testing:** Integration tests for success and each rejected status.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0232 — Implement the accepted admin provisioning command

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-02 Login
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0020, T-0084, T-0086
- **Requirements:** FR-12
- **Source:** G-02; 27 admin scope

Grant the admin scope using only the mechanism accepted in the admin decision.

**Deliverable:** Operator command or documented seed.

**Suggested files:** apps/auth-service/src/admin

**Acceptance criteria**

- Registration does not grant admin
- The resulting access token contains the admin scope
- The command is not exposed as a public HTTP route

**Verification:** Test the command against a local identity and decode the token.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-07-03 — Refresh and logout

Rotate refresh tokens and revoke the current session.

### T-0087 — Implement refresh-token rotation

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-03 Refresh and logout
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0086, T-0002
- **Requirements:** FR-02
- **Source:** 15_SEQUENCE_DIAGRAMS.md §3; 27 Phase 8 steps 8.21-8.23

Validate the refresh session and, when rotation is accepted, revoke the presented token while issuing a new pair.

**Deliverable:** POST /auth/refresh.

**Suggested files:** apps/auth-service/src/refresh

**Acceptance criteria**

- A valid unexpired unrevoked token returns a new access token
- The presented refresh token cannot be used a second time after rotation
- Expired and revoked tokens return 401
- Reuse of a rotated token is rejected

**Verification:** Integration test performs two refreshes and asserts the first token is dead.

**Testing:** Integration tests.

**Implementation notes:** If the decision ticket rejects rotation, issue a new access token without revoking the refresh token and change these criteria in the same change.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0088 — Implement logout by revoking the refresh session

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-03 Refresh and logout
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0087
- **Requirements:** FR-03
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 steps 8.24-8.25

Revoke the current refresh session so it cannot mint another access token.

**Deliverable:** POST /auth/logout.

**Suggested files:** apps/auth-service/src/logout

**Acceptance criteria**

- Logout sets revoked_at
- A later refresh with that token returns 401
- Logout does not delete the identity

**Verification:** Integration test login, logout, refresh.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0089 — Add Auth unit tests for hashing, claims, rotation, and inactive login

- **Epic:** E-07 Auth token lifecycle
- **Feature:** F-07-03 Refresh and logout
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0086, T-0087, T-0088
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 step 8.26

Collect the unit coverage the plan names for Auth token behavior.

**Deliverable:** Unit test file covering those cases.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- Hashing, claims, rotation, inactive login, and duplicate-email conflict mapping are covered
- Tests do not log tokens

**Verification:** pnpm --filter auth-service test

**Testing:** The unit tests this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-08 — Registration saga

Register a user only when an ACTIVE Auth identity and a Users profile both exist.

### F-08-01 — Registration success path

Create the global user id, identity, and profile before returning success.

### T-0090 — Validate the registration request body

- **Epic:** E-08 Registration saga
- **Feature:** F-08-01 Registration success path
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0052, T-0006, T-0059
- **Requirements:** FR-01
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 8 step 8.6; password minimum 12 characters in Phase 12

Require email, password of at least 12 characters, username, and display name before any identity is written.

**Deliverable:** Request validator for POST /auth/register.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- Missing fields return 400
- Password shorter than 12 returns 400
- Username that breaks the accepted rule returns 400
- No database row is written on validation failure

**Verification:** Unit tests for each invalid body.

**Testing:** Unit tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0091 — Create a PENDING identity with a new global user id

- **Epic:** E-08 Registration saga
- **Feature:** F-08-01 Registration success path
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0090, T-0078, T-0082
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md; 15_SEQUENCE_DIAGRAMS.md §4; 27 Phase 8 steps 8.7-8.8

Generate the immutable user id and insert the identity as PENDING with a password hash.

**Deliverable:** Repository method used by the saga.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- user id is a UUID generated before insert
- status is PENDING
- email uniqueness returns 409
- password hash is stored and the raw password is not

**Verification:** Integration test.

**Testing:** Integration test including a duplicate email.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0092 — Move registration to PROFILE_CREATING and call Users

- **Epic:** E-08 Registration saga
- **Feature:** F-08-01 Registration success path
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0091, T-0101
- **Requirements:** FR-01
- **Source:** 27 Phase 8 steps 8.9-8.11; 06_AUTH_AND_REGISTRATION.md

Set PROFILE_CREATING and call POST /internal/users/profiles with userId, username, and displayName.

**Deliverable:** Users client inside the Auth saga.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- Status is PROFILE_CREATING before the call
- The call uses the same user id as the identity
- Gateway is not the component performing this call
- The client targets the Users internal URL from config

**Verification:** Integration test with a fake Users server.

**Testing:** Integration test asserting order of status and HTTP call.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0093 — Return 201 only after the identity is ACTIVE and the profile exists

- **Epic:** E-08 Registration saga
- **Feature:** F-08-01 Registration success path
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0092
- **Requirements:** FR-01
- **Source:** 02_REQUIREMENTS.md registration guarantee; 06_AUTH_AND_REGISTRATION.md; 27 Phase 8 steps 8.12-8.13

Set ACTIVE only after Users confirms the profile, then return 201.

**Deliverable:** Successful registration response.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- Response status is 201
- Identity status is ACTIVE
- A profile confirmation was received first
- The response does not include the password hash

**Verification:** Integration test of the success path.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-08-02 — Registration failure path

Retry idempotently and compensate without reporting a false success.

### T-0094 — Retry idempotent profile creation when Users is unavailable

- **Epic:** E-08 Registration saga
- **Feature:** F-08-02 Registration failure path
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0092
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md lost response; 27 Phase 8 step 8.14; 20_TESTING_AND_VALIDATION_PLAN.md registration

Retry the same profile creation three times with backoff when the response is a timeout or a 503.

**Deliverable:** Retry policy inside the saga.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- The same user id is sent on every attempt
- A later 200 from an already-created profile continues to ACTIVE
- Three failures do not return 201
- Backoff is bounded and covered by a test clock

**Verification:** Integration test that fails the first response and succeeds the second.

**Testing:** Integration tests for lost response and for three failures.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0095 — Compensate a registration after retries are exhausted

- **Epic:** E-08 Registration saga
- **Feature:** F-08-02 Registration failure path
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0094, T-0005
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md; 13_DISTRIBUTED_SYSTEM_PATTERNS.md Saga; 27 Phase 8 step 8.15

Apply the accepted compensation behavior and return 503.

**Deliverable:** Compensation transition.

**Suggested files:** apps/auth-service/src/register

**Acceptance criteria**

- The client receives 503, never 201
- Status passes through COMPENSATING to the accepted terminal compensation state
- The accepted email-release behavior is implemented
- A compensated identity cannot log in

**Verification:** Integration test with Users always unavailable.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0096 — Add registration saga integration tests

- **Epic:** E-08 Registration saga
- **Feature:** F-08-02 Registration failure path
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0093, T-0095
- **Requirements:** FR-01
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §7; 27 Phase 8 steps 8.26-8.27

Cover success, lost Users response, Users unavailable, duplicate email, and compensation.

**Deliverable:** Integration suite for the saga.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- Each scenario from the testing plan's registration section that is in v1 has a test
- Tests assert database status, not only HTTP status

**Verification:** Run the Auth integration suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-09 — Users data model

Persist profiles and canonical friendships in MongoDB.

### F-09-01 — Profile schema

Store the user profile document and username uniqueness.

### T-0097 — Add the Users MongoDB repository layer

- **Epic:** E-09 Users data model
- **Feature:** F-09-01 Profile schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0061, T-0040
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 6 step 6.1; 07_USERS_AND_SOCIAL_GRAPH.md

Connect to Users MongoDB and expose a repository entry point.

**Deliverable:** Mongo connection used by later profile and friendship tickets.

**Suggested files:** apps/users-service/src/db

**Acceptance criteria**

- Connection string comes from config
- Ready fails when MongoDB is down
- No credentials collection is created

**Verification:** Boot against local MongoDB.

**Testing:** Connection integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0098 — Create the users collection and username uniqueness

- **Epic:** E-09 Users data model
- **Feature:** F-09-01 Profile schema
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0097, T-0006
- **Requirements:** FR-04
- **Source:** 23_DATA_MODELS_DRAFT.md User profile; 27 Phase 6 step 6.2

Store userId, username, displayName, avatar, preferences, and timestamps.

**Deliverable:** Collection setup and indexes.

**Suggested files:** apps/users-service/src/users

**Acceptance criteria**

- userId is unique
- username is stored lowercase and is unique
- preferences can hold genres, languages, and autoplay
- avatar may be null
- Passwords are not fields

**Verification:** Integration test inserts two users and rejects a duplicate username.

**Testing:** Integration test for uniqueness and lowercase normalization.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-09-02 — Friendship schema

Store one canonical friendship document per pair.

### T-0099 — Create the friendships collection and canonical pair index

- **Epic:** E-09 Users data model
- **Feature:** F-09-02 Friendship schema
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0097
- **Requirements:** FR-06
- **Source:** ADR-017; 07_USERS_AND_SOCIAL_GRAPH.md; 27 Phase 6 steps 6.3-6.6

Store friendships outside the user document and normalize the pair order.

**Deliverable:** friendships collection, unique compound index, and normalizeFriendshipPair.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- user1Id is the lesser id and user2Id is the greater id
- The unique index is on that pair
- status allows PENDING, ACCEPTED, and REJECTED
- requestedBy is stored
- Friends are not embedded as an unbounded array on the user

**Verification:** Unit test the normalizer in both input orders.

**Testing:** Unit test for normalization and an integration test that the second direction conflicts.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0100 — Add user and friendship query indexes

- **Epic:** E-09 Users data model
- **Feature:** F-09-02 Friendship schema
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0098, T-0099
- **Requirements:** —
- **Source:** 07_USERS_AND_SOCIAL_GRAPH.md indexes; 27 Phase 6 step 6.5

Index username, displayName, user1Id, user2Id, status, and createdAt.

**Deliverable:** Index creation on startup or in a migration script.

**Suggested files:** apps/users-service/src/db

**Acceptance criteria**

- Each named index exists
- Index build is idempotent

**Verification:** List indexes in mongosh.

**Testing:** Integration assertion on index names.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-10 — Profiles and user search

Create idempotent profiles and let a user read, edit, and find people.

### F-10-01 — Internal profile creation

Create a profile idempotently for the registration saga.

### T-0101 — Implement idempotent internal profile creation

- **Epic:** E-10 Profiles and user search
- **Feature:** F-10-01 Internal profile creation
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0098, T-0052
- **Requirements:** FR-01
- **Source:** 06_AUTH_AND_REGISTRATION.md Idempotent profile creation; 27 Phase 9 steps 9.1-9.4

POST /internal/users/profiles creates a profile or returns the existing one for the same user id.

**Deliverable:** Internal endpoint.

**Suggested files:** apps/users-service/src/profiles

**Acceptance criteria**

- First call creates the profile and returns 201
- Repeat call with the same user id returns 200 and does not create a second document
- A different user id with the same username returns 409
- The route is not registered on the Gateway

**Verification:** HTTP integration tests for create, repeat, and username conflict.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-10-02 — Profile read and update

Let the signed-in user view and edit profile fields.

### T-0102 — Implement GET /users/me

- **Epic:** E-10 Profiles and user search
- **Feature:** F-10-02 Profile read and update
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0101
- **Requirements:** FR-04
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 step 9.5

Return the profile for the user id in the trusted context header.

**Deliverable:** GET /users/me.

**Suggested files:** apps/users-service/src/profiles

**Acceptance criteria**

- The response includes username, display name, avatar, preferences, and created time
- A missing profile returns 404
- The handler uses x-user-id and does not accept a user id from the query string

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** Trusting x-user-id is safe only after the internal network ticket. Do not mount this route publicly except through the Gateway.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0103 — Implement PATCH /users/me

- **Epic:** E-10 Profiles and user search
- **Feature:** F-10-02 Profile read and update
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0102, T-0006
- **Requirements:** FR-04
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 step 9.6; Phase 13 edit fields

Allow the signed-in user to update display name, avatar URL, genres, languages, and autoplay.

**Deliverable:** PATCH /users/me.

**Suggested files:** apps/users-service/src/profiles

**Acceptance criteria**

- Those fields update and updatedAt changes
- Username is not changed by this endpoint
- Unknown fields are rejected
- Another user's profile cannot be patched by substituting a body user id

**Verification:** Integration test.

**Testing:** Integration tests for update and rejected username change.

**Implementation notes:** Username immutability is inferred because no requirement allows a change. Do not add username change.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-10-03 — User search

Find users by username or display name.

### T-0104 — Implement paginated user search

- **Epic:** E-10 Profiles and user search
- **Feature:** F-10-03 User search
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0100, T-0007
- **Requirements:** FR-05
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 steps 9.7-9.8

Search username and display name with the accepted minimum length and cursor.

**Deliverable:** GET /users/search.

**Suggested files:** apps/users-service/src/search

**Acceptance criteria**

- Queries shorter than the accepted minimum return 400
- Results are limited and include a next cursor
- Passwords and emails are not in the payload
- The search does not query a graph database

**Verification:** Integration test with three fixtures.

**Testing:** Integration tests for short query, hit, and cursor.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-11 — Friendships

Send, list, accept, and reject friend requests, and record durable friendship events.

### F-11-01 — Friend request lifecycle

Create, list, accept, and reject friend requests.

### T-0105 — Implement sending a friend request

- **Epic:** E-11 Friendships
- **Feature:** F-11-01 Friend request lifecycle
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0099, T-0102
- **Requirements:** FR-06
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 steps 9.9-9.13

Create a PENDING canonical friendship from the signed-in user to a target user.

**Deliverable:** POST /friend-requests.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- Self-request returns 400
- An unknown target returns 404
- The pair is normalized before insert
- An existing pair returns 409
- requestedBy is the caller

**Verification:** Integration tests.

**Testing:** Integration tests for self, duplicate, and both id orders.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0106 — List incoming and outgoing friend requests

- **Epic:** E-11 Friendships
- **Feature:** F-11-01 Friend request lifecycle
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0105, T-0007
- **Requirements:** FR-07
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 steps 9.14-9.15

Return pending requests where the caller is the target or the requester.

**Deliverable:** GET /friend-requests/incoming and GET /friend-requests/outgoing.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- Incoming excludes requests the caller sent
- Outgoing excludes requests sent to the caller
- Accepted rows are not included
- Results are paginated with the accepted cursor

**Verification:** Integration test with two users.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0107 — Accept a friend request as the target user

- **Epic:** E-11 Friendships
- **Feature:** F-11-01 Friend request lifecycle
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0106
- **Requirements:** FR-07
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 steps 9.16-9.17

Set status ACCEPTED only when the caller is the target, not the requester.

**Deliverable:** POST /friend-requests/:id/accept.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- Target receives 200 and status becomes ACCEPTED
- Requester receives 403
- A stranger receives 403
- Accepting twice does not create a second row

**Verification:** Integration test.

**Testing:** Integration tests for target, requester, and stranger.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0108 — Reject a friend request as the target user

- **Epic:** E-11 Friendships
- **Feature:** F-11-01 Friend request lifecycle
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0106
- **Requirements:** FR-07
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 step 9.18

Set status REJECTED only for the target user.

**Deliverable:** POST /friend-requests/:id/reject.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- Target can reject a PENDING request
- Requester cannot reject
- Rejected is not returned by the friends list

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Can be built beside accept.

### T-0109 — List accepted friends

- **Epic:** E-11 Friendships
- **Feature:** F-11-01 Friend request lifecycle
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0107
- **Requirements:** FR-08
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 step 9.19

Return accepted friendships for the caller with the other user's public profile fields.

**Deliverable:** GET /friends.

**Suggested files:** apps/users-service/src/friendships

**Acceptance criteria**

- Only ACCEPTED pairs are returned
- The caller is not listed as their own friend
- Pending requests are excluded
- Profile fields are limited to user id, username, and display name

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-11-02 — Friendship events

Durably record friend-request events and publish them to RabbitMQ.

### T-0110 — Write friendship events to the Users outbox

- **Epic:** E-11 Friendships
- **Feature:** F-11-02 Friendship events
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0105, T-0107
- **Requirements:** NFR-12
- **Source:** 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; ADR-019; 27 Phase 9 steps 9.20-9.22

In the same logical operation as the friendship write, store FRIEND_REQUEST_CREATED or FRIEND_REQUEST_ACCEPTED in outbox_events.

**Deliverable:** Outbox documents with eventId, type, payload, and PENDING status.

**Suggested files:** apps/users-service/src/outbox

**Acceptance criteria**

- Create writes FRIEND_REQUEST_CREATED
- Accept writes FRIEND_REQUEST_ACCEPTED
- Reject does not write a notification event unless a later decision adds one
- eventId is stable and unique
- A failed business write does not leave an outbox document

**Verification:** Integration test reads the outbox collection.

**Testing:** Integration tests.

**Implementation notes:** MongoDB does not provide the same multi-document transaction story as the SQL outbox diagram unless a transaction is used. Use a Mongo transaction for the friendship write and outbox insert, and record that in the ticket result.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0111 — Publish pending Users outbox events to RabbitMQ

- **Epic:** E-11 Friendships
- **Feature:** F-11-02 Friendship events
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0110, T-0042, T-0192
- **Requirements:** NFR-12
- **Source:** 15_SEQUENCE_DIAGRAMS.md §13; 27 Phase 9 step 9.23

Poll pending outbox events and publish them, marking them published only after the broker confirms.

**Deliverable:** Outbox publisher loop.

**Suggested files:** apps/users-service/src/outbox

**Acceptance criteria**

- A broker outage leaves the event PENDING
- A crash after publish can republish, so consumers must tolerate duplicates
- Published events are not sent again once marked
- Play and pause events are not published here

**Verification:** Integration test with RabbitMQ stopped, then started.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0112 — Test profile idempotency, friendship rules, and outbox writes

- **Epic:** E-11 Friendships
- **Feature:** F-11-02 Friendship events
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0104, T-0108, T-0109, T-0110
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 9 step 9.24

Fill any gaps in the Users tests named by the plan.

**Deliverable:** A single test command that covers the named cases.

**Suggested files:** apps/users-service

**Acceptance criteria**

- Idempotent profile, pair normalization, duplicate prevention, accept authorization, reject authorization, and outbox creation are all automated

**Verification:** Run the Users test script.

**Testing:** The aggregated suite.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-12 — API gateway

Route HTTP traffic, validate JWTs locally, enforce admin scope and rate limits, and forward request context.

### F-12-01 — Edge middleware

Assign request ids, validate JWTs from a cached JWKS, and forward trusted context.

### T-0113 — Assign and forward a request id

- **Epic:** E-12 API gateway
- **Feature:** F-12-01 Edge middleware
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0056, T-0049
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.1; Phase 26 step 26.2

Create a request id when the caller does not send one and forward x-request-id upstream.

**Deliverable:** Gateway middleware.

**Suggested files:** apps/gateway/src/request-id

**Acceptance criteria**

- A response echoes the request id
- An inbound x-request-id is preserved if it is a safe token
- The id is logged

**Verification:** HTTP test.

**Testing:** Unit or HTTP test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0114 — Cache Auth JWKS and refresh an unknown kid

- **Epic:** E-12 API gateway
- **Feature:** F-12-01 Edge middleware
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0083, T-0051, T-0056
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 steps 10.3-10.5; ADR-003

Fetch JWKS from Auth, cache it for five minutes, and refresh immediately when a token kid is unknown.

**Deliverable:** JWKS cache used by Gateway verification.

**Suggested files:** apps/gateway/src/jwks

**Acceptance criteria**

- A valid token verifies with no Auth call after the cache is warm
- An unknown kid triggers one refresh
- Expired tokens return 401
- Invalid signatures return 401

**Verification:** Tests with a local key pair and a fake JWKS server.

**Testing:** Unit tests for cache hit, unknown kid, expiry, and bad signature.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0115 — Forward trusted user context to upstream services

- **Epic:** E-12 API gateway
- **Feature:** F-12-01 Edge middleware
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0114, T-0113
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.6; 15_SEQUENCE_DIAGRAMS.md §2

Set x-request-id, x-user-id, and x-user-scopes from the verified token rather than from client-supplied copies.

**Deliverable:** Proxy helper.

**Suggested files:** apps/gateway/src/proxy

**Acceptance criteria**

- Client-supplied x-user-id is overwritten
- Scopes come from the token
- Auth is not called on the forwarded request

**Verification:** Test with an upstream echo server.

**Testing:** HTTP test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-12-02 — Public routing

Proxy the unauthenticated routes named by the implementation plan.

### T-0116 — Proxy public Auth routes

- **Epic:** E-12 API gateway
- **Feature:** F-12-02 Public routing
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0113, T-0086, T-0093
- **Requirements:** FR-01; FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.2

Proxy register, login, refresh, and JWKS without requiring an access token.

**Deliverable:** Four public Auth routes.

**Suggested files:** apps/gateway/src/routes/auth

**Acceptance criteria**

- POST /auth/register, POST /auth/login, POST /auth/refresh, and GET /.well-known/jwks.json are proxied
- They do not require a bearer token
- Upstream 409 and 503 are preserved

**Verification:** Route tests against a fake Auth server.

**Testing:** HTTP tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0117 — Proxy movie search and detail according to the access decision

- **Epic:** E-12 API gateway
- **Feature:** F-12-02 Public routing
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0115, T-0014, T-0150, T-0153
- **Requirements:** FR-10
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.2; G-07

Expose GET /movies/search and GET /movies/:movieId using the accepted anonymous-or-authenticated decision.

**Deliverable:** Movie read routes on the Gateway.

**Suggested files:** apps/gateway/src/routes/movies

**Acceptance criteria**

- The auth requirement matches the decision entry
- The Gateway does not query Meilisearch itself
- Upstream errors map to the shared error body

**Verification:** Route test.

**Testing:** HTTP tests with and without a token according to the decision.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-12-03 — Authenticated routing

Proxy signed-in user routes without calling Auth on every request.

### T-0118 — Proxy authenticated profile, search, and friendship routes

- **Epic:** E-12 API gateway
- **Feature:** F-12-03 Authenticated routing
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0115, T-0103, T-0104, T-0109, T-0108, T-0088
- **Requirements:** FR-03; FR-04; FR-05; FR-06; FR-07; FR-08
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.7

Require a valid access token and proxy logout, profile, user search, friend requests, and friends.

**Deliverable:** Authenticated user route table.

**Suggested files:** apps/gateway/src/routes/users

**Acceptance criteria**

- Missing token returns 401
- The path list matches Phase 10 step 10.7 user and friend paths
- Internal profile creation is not proxied

**Verification:** Route table test.

**Testing:** HTTP tests for 401 and for one proxied path.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0119 — Proxy watchlist, room control, and media-access routes

- **Epic:** E-12 API gateway
- **Feature:** F-12-03 Authenticated routing
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0115, T-0157, T-0166, T-0168, T-0172, T-0212
- **Requirements:** FR-11; FR-22; FR-26; FR-29
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.7

Proxy the authenticated watchlist, room control, and media-access paths. Do not proxy WebSocket rooms through the Gateway.

**Deliverable:** Route table for those paths.

**Suggested files:** apps/gateway/src/routes/rooms

**Acceptance criteria**

- WebSocket upgrade is not handled by the Gateway
- Each path in the plan's room, watchlist, and media-access list is present
- A valid token is required

**Verification:** Route test and a negative test that Gateway does not listen on 4014.

**Testing:** HTTP tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-12-04 — Admin routing and rate limits

Guard admin routes and apply the documented rate limits.

### T-0120 — Guard and proxy admin movie routes

- **Epic:** E-12 API gateway
- **Feature:** F-12-04 Admin routing and rate limits
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0115, T-0020, T-0144, T-0145, T-0147, T-0148, T-0202, T-0203
- **Requirements:** FR-12; FR-13; FR-14; FR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 steps 10.8-10.9

Require the admin scope and proxy the admin movie and upload routes.

**Deliverable:** Admin route table.

**Suggested files:** apps/gateway/src/routes/admin

**Acceptance criteria**

- A signed-in user without admin receives 403
- An admin token is proxied
- The path list matches Phase 10 step 10.9

**Verification:** HTTP tests for both tokens.

**Testing:** HTTP tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0121 — Apply the documented Gateway rate limits

- **Epic:** E-12 API gateway
- **Feature:** F-12-04 Admin routing and rate limits
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0116, T-0117, T-0118, T-0119
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.10; 22_SECURITY_MODEL.md rate limiting

Limit login, registration, search, room creation, and the default authenticated API at the documented thresholds.

**Deliverable:** Rate limit middleware.

**Suggested files:** apps/gateway/src/rate-limit

**Acceptance criteria**

- Login is 5 per minute per IP
- Register is 3 per minute per IP
- Search is 60 per minute per user or IP
- Room create is 30 per minute per user
- Other authenticated API is 300 per minute per user
- Excess requests return the RATE_LIMITED error

**Verification:** Tests with a fake clock.

**Testing:** Unit tests per bucket.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0122 — Test Gateway auth failures, upstream 503, and request ids

- **Epic:** E-12 API gateway
- **Feature:** F-12-04 Admin routing and rate limits
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0120, T-0121
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 10 step 10.11

Cover expired token, bad signature, missing scope, upstream 503 mapping, and request-id forwarding.

**Deliverable:** Gateway test suite for those cases.

**Suggested files:** apps/gateway

**Acceptance criteria**

- Each named case has an automated test
- 401 and 403 use the shared error codes

**Verification:** Run the Gateway test script.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-13 — Web application shell

Create the React client shell, session handling, and route guards.

### F-13-01 — Application shell

Create the client routes and shared screen states.

### T-0123 — Create the Vite React TypeScript application

- **Epic:** E-13 Web application shell
- **Feature:** F-13-01 Application shell
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0032, T-0001
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.1

Create the web package on port 3000.

**Deliverable:** A Vite React TypeScript app that renders a home page.

**Suggested files:** apps/web

**Acceptance criteria**

- pnpm --filter web dev serves port 3000
- TypeScript strict settings extend the base config
- The app does not call Auth, Users, or Movie directly

**Verification:** Open the home page.

**Testing:** Playwright smoke is a later ticket; this ticket checks the dev server responds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0124 — Add the web route shell

- **Epic:** E-13 Web application shell
- **Feature:** F-13-01 Application shell
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0123
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.2

Register routes for register, login, movie search, movie detail, watchlist, profile, friends, public rooms, room, admin movies, and scheduled rooms.

**Deliverable:** Route table with placeholder screens.

**Suggested files:** apps/web/src/routes

**Acceptance criteria**

- Each named route renders a titled placeholder
- Unknown routes render a not-found state

**Verification:** Router unit test or Playwright navigation across placeholders.

**Testing:** Route render test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0125 — Add shared loading, empty, error, unauthorized, and forbidden states

- **Epic:** E-13 Web application shell
- **Feature:** F-13-01 Application shell
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0123
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.9

Build the five shared screen states so later pages do not invent their own copies.

**Deliverable:** Reusable state components.

**Suggested files:** apps/web/src/ui

**Acceptance criteria**

- Each state has accessible text
- Error state can show the shared error code
- Forbidden and unauthorized are distinct

**Verification:** Component test for each state.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Can be built beside the route shell.

### T-0130 — Add a Playwright smoke test for the home page

- **Epic:** E-13 Web application shell
- **Feature:** F-13-01 Application shell
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0124
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.10

Open the home page in Playwright and assert it renders.

**Deliverable:** One smoke spec and a package script.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The test opens the web origin
- It fails if the home title is missing
- It does not require a logged-in user

**Verification:** Run the Playwright spec.

**Testing:** The smoke spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-13-02 — Session client

Call only the Gateway for HTTP and recover from an expired access token.

### T-0126 — Add a Gateway-only HTTP client

- **Epic:** E-13 Web application shell
- **Feature:** F-13-02 Session client
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0123, T-0116
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.3; 04_HIGH_LEVEL_ARCHITECTURE.md API traffic

Send HTTP only to the Gateway base URL.

**Deliverable:** API client.

**Suggested files:** apps/web/src/api

**Acceptance criteria**

- Base URL is configured
- A test fails if a request targets port 4001, 4002, 4003, 4004, or 4005
- JSON errors are parsed into the shared error shape

**Verification:** Unit test of the base URL guard.

**Testing:** Unit test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0127 — Store the access token and refresh it after a 401

- **Epic:** E-13 Web application shell
- **Feature:** F-13-02 Session client
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0126, T-0022, T-0087
- **Requirements:** FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 steps 11.4-11.5; G-08

Keep the access token in memory and implement the accepted refresh storage. Retry the original request once after a refresh.

**Deliverable:** Auth state and 401 interceptor.

**Suggested files:** apps/web/src/auth

**Acceptance criteria**

- Access token is not written to localStorage
- One 401 triggers one refresh and one retry
- A failed refresh clears the session and shows unauthorized
- Parallel 401s share one refresh

**Verification:** Client unit tests with a fake Gateway.

**Testing:** Unit tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0128 — Clear the session and call logout

- **Epic:** E-13 Web application shell
- **Feature:** F-13-02 Session client
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0127, T-0118
- **Requirements:** FR-03
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 step 11.6

Call Gateway logout and clear local auth state.

**Deliverable:** Logout action.

**Suggested files:** apps/web/src/auth

**Acceptance criteria**

- Gateway logout is called
- In-memory access token is cleared
- The accepted refresh storage is cleared
- The user is sent to the login route

**Verification:** Component or unit test.

**Testing:** Unit test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0129 — Add protected and admin route guards

- **Epic:** E-13 Web application shell
- **Feature:** F-13-02 Session client
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0124, T-0127, T-0020
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 11 steps 11.7-11.8

Redirect anonymous users from protected routes and block non-admin users from admin routes.

**Deliverable:** Route wrappers.

**Suggested files:** apps/web/src/routes

**Acceptance criteria**

- Anonymous user on profile sees login
- Signed-in non-admin on admin movies sees forbidden
- Admin reaches the placeholder

**Verification:** Router tests.

**Testing:** Router tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-14 — Registration and login UI

Let a person register, log in, and land on movie search.

### F-14-01 — Register screen

Collect registration fields and surface duplicate-account errors.

### T-0131 — Build the registration form

- **Epic:** E-14 Registration and login UI
- **Feature:** F-14-01 Register screen
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0126, T-0125, T-0116
- **Requirements:** FR-01
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 12 steps 12.1-12.4

Collect email, username, display name, password, and confirm password, and submit them to the Gateway.

**Deliverable:** Register page.

**Suggested files:** apps/web/src/pages/register

**Acceptance criteria**

- Password shorter than 12 characters cannot be submitted
- Mismatched confirmation cannot be submitted
- A valid form calls POST /auth/register
- Success continues to login or an explicit signed-out confirmation, and does not invent an auto-login the API does not return

**Verification:** Component test plus a mocked submit.

**Testing:** Component tests.

**Implementation notes:** The registration API described in the plan returns 201 and does not say it also returns tokens. Do not pretend it logs the user in unless the Auth response is extended in the same change.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0132 — Show duplicate email and duplicate username messages

- **Epic:** E-14 Registration and login UI
- **Feature:** F-14-01 Register screen
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0131
- **Requirements:** FR-01
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 12 steps 12.5-12.6

Map the 409 responses for duplicate email and duplicate username to different messages.

**Deliverable:** Error copy on the register form.

**Suggested files:** apps/web/src/pages/register

**Acceptance criteria**

- Email conflict mentions the email
- Username conflict mentions the username
- A 503 says registration did not complete and does not say the account is ready

**Verification:** Component tests with mocked responses.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-14-02 — Login screen

Log in and redirect to movie search.

### T-0133 — Build the login form and redirect to movie search

- **Epic:** E-14 Registration and login UI
- **Feature:** F-14-02 Login screen
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0127, T-0124
- **Requirements:** FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 12 steps 12.7-12.10

Submit credentials, store the access token, and redirect to movie search.

**Deliverable:** Login page.

**Suggested files:** apps/web/src/pages/login

**Acceptance criteria**

- Valid login stores the token using the session ticket
- The browser lands on the search route
- Invalid login shows unauthorized copy and stays on the form

**Verification:** Component test with a mocked Gateway.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-15 — Profile and social UI

Let a person edit a profile, find users, and manage friendships.

### F-15-01 — Profile screens

Show and edit the signed-in profile.

### T-0134 — Build the profile view and edit form

- **Epic:** E-15 Profile and social UI
- **Feature:** F-15-01 Profile screens
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0129, T-0118
- **Requirements:** FR-04
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 13 steps 13.1-13.3

Show username, display name, avatar, preferences, and created date, and edit the fields the API allows.

**Deliverable:** Profile page.

**Suggested files:** apps/web/src/pages/profile

**Acceptance criteria**

- Read uses GET /users/me
- Edit submits display name, avatar URL, genres, languages, and autoplay
- Username is visible and not editable
- Load and error states use the shared components

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-15-02 — Friends screens

Search people and manage friend requests.

### T-0135 — Build user search with a two-character minimum

- **Epic:** E-15 Profile and social UI
- **Feature:** F-15-02 Friends screens
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0129, T-0104
- **Requirements:** FR-05
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 13 steps 13.4-13.5

Search users and do not call the API before the accepted minimum length.

**Deliverable:** User search page.

**Suggested files:** apps/web/src/pages/friends

**Acceptance criteria**

- One character does not call the API
- Two accepted characters call GET /users/search
- Empty results use the empty state

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0136 — Build send, incoming, outgoing, accept, and reject actions

- **Epic:** E-15 Profile and social UI
- **Feature:** F-15-02 Friends screens
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0135, T-0107, T-0108
- **Requirements:** FR-06; FR-07
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 13 steps 13.6-13.10

Let the user send a request and manage incoming and outgoing requests.

**Deliverable:** Friend request screens.

**Suggested files:** apps/web/src/pages/friends

**Acceptance criteria**

- Send calls POST /friend-requests
- Incoming and outgoing lists are separate
- Accept and reject call the matching endpoints
- A 409 shows that the relationship already exists

**Verification:** Component tests with a mocked API.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0137 — Build the friends list page

- **Epic:** E-15 Profile and social UI
- **Feature:** F-15-02 Friends screens
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0129, T-0109
- **Requirements:** FR-08
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 13 step 13.11

Show accepted friends.

**Deliverable:** Friends page.

**Suggested files:** apps/web/src/pages/friends

**Acceptance criteria**

- It calls GET /friends
- An empty list uses the empty state
- Pending requests are not shown as friends

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-16 — Movie data model

Persist catalog, upload, watchlist, sync checkpoint, and movie outbox rows.

### F-16-01 — Catalog schema

Store movie metadata and the accepted status values.

### T-0138 — Add Movie PostgreSQL migration tooling

- **Epic:** E-16 Movie data model
- **Feature:** F-16-01 Catalog schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0064, T-0039, T-0077
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 7 step 7.1

Use the same migration style chosen for Auth, pointed at the movie database.

**Deliverable:** Movie migration command.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- It targets port 5434 in local config
- It cannot apply Auth migrations
- Applied versions are recorded

**Verification:** Run it on an empty movie database.

**Testing:** Runner test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0139 — Create the movies table from the accepted state model

- **Epic:** E-16 Movie data model
- **Feature:** F-16-01 Catalog schema
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0138, T-0013
- **Requirements:** FR-12
- **Source:** 23_DATA_MODELS_DRAFT.md Movie; 27 Phase 7 steps 7.2-7.3; G-06

Store movie metadata, creator, timestamps, and the status fields accepted by the state-machine decision.

**Deliverable:** movies migration.

**Suggested files:** apps/movie-service/migrations

**Acceptance criteria**

- movie_id is the primary key
- title, description, and genres are required
- The status check matches the decision diagram rather than an unreviewed merge
- created_by_user_id is stored without a cross-database foreign key

**Verification:** Migration test rejects an illegal status.

**Testing:** Migration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-16-02 — Upload, watchlist, and sync schema

Store upload sessions, watchlist rows, the search checkpoint, and a movie outbox.

### T-0140 — Create the movie_uploads table

- **Epic:** E-16 Movie data model
- **Feature:** F-16-02 Upload, watchlist, and sync schema
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0139
- **Requirements:** FR-13
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 7 step 7.4

Store multipart upload id, object key, part count, status, and expiry.

**Deliverable:** movie_uploads migration.

**Suggested files:** apps/movie-service/migrations

**Acceptance criteria**

- upload_id is the primary key
- movie_id is indexed
- expires_at and completed_at exist
- No media bytes are stored in PostgreSQL

**Verification:** Migration test.

**Testing:** Migration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0141 — Create the watchlist_items table

- **Epic:** E-16 Movie data model
- **Feature:** F-16-02 Upload, watchlist, and sync schema
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0139, T-0008
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 7 step 7.5

Store one row per user and movie if Movie Service was accepted as the owner.

**Deliverable:** watchlist_items migration, or a note moving the table if the decision chose Users.

**Suggested files:** apps/movie-service/migrations

**Acceptance criteria**

- Primary key is user_id plus movie_id when Movie owns it
- created_at is stored
- There is no cross-database foreign key

**Verification:** Migration test.

**Testing:** Migration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0142 — Create search checkpoint and movie outbox tables

- **Epic:** E-16 Movie data model
- **Feature:** F-16-02 Upload, watchlist, and sync schema
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0138
- **Requirements:** NFR-08
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 7 steps 7.6-7.8

Add movie_index_sync_state with one movies row and movie_outbox_events for future durable movie events.

**Deliverable:** Both migrations plus indexes on movie status, publish time, update time, and watchlist user.

**Suggested files:** apps/movie-service/migrations

**Acceptance criteria**

- Checkpoint table can store last successful sync
- Outbox matches the draft columns
- No outbox publisher is required in this ticket

**Verification:** Migration test.

**Testing:** Migration test.

**Implementation notes:** The plan creates the movie outbox for future events. Search reconciliation is cron-based, not outbox-based, in v1.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-17 — Movie catalog API

Let an admin create, edit, publish, and schedule movies, and let clients read published movies.

### F-17-01 — Admin movie metadata API

Create and edit draft movies.

### T-0143 — Implement movie repository reads and writes

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-01 Admin movie metadata API
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0139, T-0142
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.1

Add repository functions for create, update, get by id, publish, schedule, list due schedules, and watchlist operations.

**Deliverable:** Repository module covered by database tests.

**Suggested files:** apps/movie-service/src/movies

**Acceptance criteria**

- Each function talks only to Movie PostgreSQL
- Get by id returns drafts to the admin caller path and the public path is filtered later
- No Meilisearch call lives in the repository

**Verification:** Repository integration tests.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0144 — Implement admin movie creation as a draft

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-01 Admin movie metadata API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0143, T-0052
- **Requirements:** FR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 steps 14.7-14.9

Create a movie from title, description, genres, optional duration, and optional poster key.

**Deliverable:** POST /admin/movies.

**Suggested files:** apps/movie-service/src/admin

**Acceptance criteria**

- New movies start in the draft publication state from the state diagram
- The creator user id comes from trusted context
- Validation failure writes nothing

**Verification:** HTTP integration test.

**Testing:** Integration test.

**Implementation notes:** Admin scope is enforced at the Gateway. The service still checks the forwarded scope so a direct internal call without admin is rejected.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0145 — Implement admin movie edit

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-01 Admin movie metadata API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0144
- **Requirements:** FR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.10

Update editable metadata for a movie that has not been abandoned.

**Deliverable:** PATCH /admin/movies/:movieId.

**Suggested files:** apps/movie-service/src/admin

**Acceptance criteria**

- Title, description, genres, duration, and poster key can change
- movie id does not change
- A missing movie returns 404

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0146 — Add an admin read of a movie including drafts

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-01 Admin movie metadata API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Inferred
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0144, T-0020
- **Requirements:** FR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 15 edit page; G-12

Let an admin load a draft or unpublished movie. The public GET cannot do this.

**Deliverable:** GET /admin/movies/:movieId.

**Suggested files:** apps/movie-service/src/admin

**Acceptance criteria**

- Admin receives draft fields
- A non-admin is rejected
- The endpoint is inferred from the edit page and is labeled as such in the API notes

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-17-02 — Publish and schedule API

Publish immediately or at a future time.

### T-0147 — Publish a movie in PostgreSQL before indexing it

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-02 Publish and schedule API
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0145, T-0152
- **Requirements:** FR-14; NFR-08
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md Publish now; 27 Phase 14 steps 14.11-14.14

Set the published state in PostgreSQL and then attempt a Meilisearch upsert.

**Deliverable:** POST /admin/movies/:movieId/publish.

**Suggested files:** apps/movie-service/src/publish

**Acceptance criteria**

- PostgreSQL is updated first
- A Meilisearch failure leaves the PostgreSQL state in place
- The response says the catalog write succeeded even if the index must catch up
- A movie whose media state cannot be published under the state diagram is rejected

**Verification:** Integration test with Meilisearch stopped.

**Testing:** Integration tests for success and index failure.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0148 — Schedule a future movie publication

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-02 Publish and schedule API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0145
- **Requirements:** FR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 steps 14.15-14.16

Store a future publish time and the scheduled publication state.

**Deliverable:** POST /admin/movies/:movieId/schedule.

**Suggested files:** apps/movie-service/src/publish

**Acceptance criteria**

- Body requires publishAt
- A past time is rejected
- Status becomes the scheduled state from the diagram
- The movie is not indexed as published yet

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0149 — Publish movies whose scheduled time has arrived

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-02 Publish and schedule API
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0148, T-0147, T-0016
- **Requirements:** FR-15
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md Scheduled publish; 27 Phase 14 step 14.17

Run a worker on the accepted interval, find due movies, and use the same publish path.

**Deliverable:** Scheduled publish worker.

**Suggested files:** apps/movie-service/src/publish

**Acceptance criteria**

- A due movie becomes published
- A future movie is left alone
- The worker interval matches the decision
- A crash mid-batch can be run again safely

**Verification:** Integration test with a clock.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-17-03 — Public movie read API

Read one published movie and search published movies.

### T-0150 — Implement public movie detail for published movies

- **Epic:** E-17 Movie catalog API
- **Feature:** F-17-03 Public movie read API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0143
- **Requirements:** FR-10
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.18

Return one movie only when its publication state is published.

**Deliverable:** GET /movies/:movieId.

**Suggested files:** apps/movie-service/src/catalog

**Acceptance criteria**

- A published movie returns 200
- A draft returns 404
- The body does not include upload secrets or raw object credentials

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-18 — Search projection

Index published movies in Meilisearch and repair the index by reconciliation.

### F-18-01 — Meilisearch projection

Configure the movies index and upsert on publish.

### T-0151 — Add the Meilisearch client and movies index settings

- **Epic:** E-18 Search projection
- **Feature:** F-18-01 Meilisearch projection
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0043, T-0064, T-0015
- **Requirements:** FR-10; NFR-06
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 steps 14.2-14.6; ADR-007

Configure index movies with the documented searchable, filterable, and sortable attributes.

**Deliverable:** Index setup command.

**Suggested files:** apps/movie-service/src/search

**Acceptance criteria**

- Searchable attributes are title, description, and genres
- Filterable attributes are genres and publication status
- Sortable attributes are title, createdAt, and publishAt
- Setup is idempotent

**Verification:** Call Meilisearch settings API after the command.

**Testing:** Integration test against local Meilisearch.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0152 — Upsert a published movie into Meilisearch by movie id

- **Epic:** E-18 Search projection
- **Feature:** F-18-01 Meilisearch projection
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0151, T-0143
- **Requirements:** NFR-08
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md; 13_DISTRIBUTED_SYSTEM_PATTERNS.md Idempotency

Map a movie row to the search document and upsert by movie id.

**Deliverable:** Upsert function.

**Suggested files:** apps/movie-service/src/search

**Acceptance criteria**

- Repeating the upsert does not create a second document
- Unpublished movies are not searchable
- The document is marked as a projection, not stored back as the source of truth

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0153 — Search only published movies

- **Epic:** E-18 Search projection
- **Feature:** F-18-01 Meilisearch projection
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0152
- **Requirements:** FR-10; NFR-06
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 steps 14.19-14.20

Query Meilisearch and return published matches, with optional genre filter, limit, and offset.

**Deliverable:** GET /movies/search.

**Suggested files:** apps/movie-service/src/search

**Acceptance criteria**

- Drafts are absent
- Genre filter is applied
- No Redis result cache is consulted
- Meilisearch downtime returns UPSTREAM_UNAVAILABLE

**Verification:** Integration test.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-18-02 — Reconciliation and rebuild

Repair missed index updates and support a full rebuild.

### T-0154 — Reconcile the movie index with a safe checkpoint

- **Epic:** E-18 Search projection
- **Feature:** F-18-02 Reconciliation and rebuild
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0142, T-0152, T-0016
- **Requirements:** NFR-08
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md; 15_SEQUENCE_DIAGRAMS.md §14; 27 Phase 14 steps 14.24-14.25

Incrementally upsert movies in a bounded window and move the checkpoint only after all upserts succeed.

**Deliverable:** Reconciliation job.

**Suggested files:** apps/movie-service/src/search

**Acceptance criteria**

- The window starts at last success minus the accepted overlap and ends at job start
- A failed upsert leaves the old checkpoint
- A repeated window is safe
- The job interval matches the decision

**Verification:** Integration test that fails halfway and asserts the checkpoint.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0155 — Add a full Meilisearch rebuild command

- **Epic:** E-18 Search projection
- **Feature:** F-18-02 Reconciliation and rebuild
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0152
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.26; ADR-007

Rebuild the movies index from PostgreSQL.

**Deliverable:** pnpm --filter movie-service search:rebuild.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- The command reads PostgreSQL
- Published movies exist in the index afterward
- Unpublished movies are not searchable
- The command can be run twice

**Verification:** Run it against local services.

**Testing:** Integration test with two movies.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0156 — Test publish, schedule, index failure, and search filters

- **Epic:** E-18 Search projection
- **Feature:** F-18-02 Reconciliation and rebuild
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0147, T-0149, T-0154, T-0153
- **Requirements:** —
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §8; 27 Phase 14 step 14.27

Automate the movie indexing scenarios named in the testing plan.

**Deliverable:** Movie search integration suite.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- Meilisearch unavailable, checkpoint safety, overlap upsert, scheduled publish, and full rebuild are covered

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-19 — Watchlist

Let a user save and remove movies.

### F-19-01 — Watchlist API

Add, remove, and list saved movies for the signed-in user.

### T-0157 — Add a movie to the signed-in user's watchlist

- **Epic:** E-19 Watchlist
- **Feature:** F-19-01 Watchlist API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0141, T-0150
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.21

Insert a watchlist row for a published movie.

**Deliverable:** POST /movies/:movieId/watchlist.

**Suggested files:** apps/movie-service/src/watchlist

**Acceptance criteria**

- The user id comes from trusted context
- A second add does not create a duplicate
- An unpublished movie returns 404
- Another user id in the body is ignored

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0158 — Remove a watchlist item

- **Epic:** E-19 Watchlist
- **Feature:** F-19-01 Watchlist API
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0157
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.22

Delete the caller's watchlist row.

**Deliverable:** DELETE /movies/:movieId/watchlist.

**Suggested files:** apps/movie-service/src/watchlist

**Acceptance criteria**

- The row is removed
- Removing a missing row is a successful no-op or a 404, and the choice is documented
- Another user's row remains

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0159 — List the signed-in user's watchlist

- **Epic:** E-19 Watchlist
- **Feature:** F-19-01 Watchlist API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0157
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 14 step 14.23

Return the caller's saved movies with the catalog fields needed by the watchlist page.

**Deliverable:** GET /watchlist.

**Suggested files:** apps/movie-service/src/watchlist

**Acceptance criteria**

- Only the caller's rows are returned
- Title and poster are read from Movie PostgreSQL at request time
- An empty list is an empty array

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** Reading title from the movie row avoids a second source of truth. The optional duplicated projection in document 07 is not required.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-20 — Movie web experience

Provide admin catalog screens, debounced search, movie detail, and watchlist screens.

### F-20-01 — Admin movie screens

Create, edit, publish, and schedule movies in the web app.

### T-0160 — Build admin movie create and edit pages

- **Epic:** E-20 Movie web experience
- **Feature:** F-20-01 Admin movie screens
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0129, T-0146, T-0145, T-0120
- **Requirements:** FR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 15 steps 15.1-15.2

Let an admin create a draft and edit its metadata.

**Deliverable:** Admin create and edit pages.

**Suggested files:** apps/web/src/pages/admin

**Acceptance criteria**

- Create submits the documented body
- Edit loads GET /admin/movies/:id
- A non-admin never sees a successful save
- Validation errors stay on the form

**Verification:** Component tests with a mocked Gateway.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0161 — Build publish-now and schedule-publish actions

- **Epic:** E-20 Movie web experience
- **Feature:** F-20-01 Admin movie screens
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0160, T-0148
- **Requirements:** FR-14; FR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 15 steps 15.3-15.4

Call publish and schedule from the admin movie page.

**Deliverable:** Both actions.

**Suggested files:** apps/web/src/pages/admin

**Acceptance criteria**

- Publish calls the publish endpoint
- Schedule requires a future time
- The UI tells the admin when the catalog write succeeded and search may lag

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-20-02 — Search, detail, and watchlist screens

Search, open, and save movies.

### T-0162 — Build debounced movie search

- **Epic:** E-20 Movie web experience
- **Feature:** F-20-02 Search, detail, and watchlist screens
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0124, T-0153, T-0015, T-0117
- **Requirements:** FR-10; NFR-06
- **Source:** 09_MOVIE_SEARCH_AND_INDEXING.md Client-side debounce; 27 Phase 15 steps 15.5-15.7

Search from the web client with the accepted debounce and minimum length.

**Deliverable:** Movie search page.

**Suggested files:** apps/web/src/pages/search

**Acceptance criteria**

- Typing does not send a request per keystroke
- The wait is the accepted debounce
- Below the minimum length, no request is sent
- Results link to the detail route

**Verification:** Component test with a fake timer.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0163 — Build the movie detail page

- **Epic:** E-20 Movie web experience
- **Feature:** F-20-02 Search, detail, and watchlist screens
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0162, T-0150
- **Requirements:** FR-10
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 15 step 15.8; 01_PRODUCT_OVERVIEW.md open a movie

Show the published movie fields returned by the detail API.

**Deliverable:** Detail page.

**Suggested files:** apps/web/src/pages/movie

**Acceptance criteria**

- It loads GET /movies/:movieId
- A 404 uses the error state
- Solo, private, and public actions have visible places for the later room tickets

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0164 — Build watchlist add, remove, and list screens

- **Epic:** E-20 Movie web experience
- **Feature:** F-20-02 Search, detail, and watchlist screens
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0163, T-0159, T-0158, T-0129
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 15 steps 15.9-15.11

Save a movie from the detail page and manage it on the watchlist page.

**Deliverable:** Watchlist controls and page.

**Suggested files:** apps/web/src/pages/watchlist

**Acceptance criteria**

- Add and remove call the Gateway
- The list page calls GET /watchlist
- Anonymous users are sent to login

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-21 — Rooms control API

Create, list, invite, authorize, and close ephemeral rooms in Redis.

### F-21-01 — Room state store

Define Redis room, member, message, and event keys.

### T-0165 — Implement Redis key helpers and room document shapes

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-01 Room state store
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0068, T-0041, T-0009, T-0010
- **Requirements:** —
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md; 23_DATA_MODELS_DRAFT.md Room state; 27 Phase 16 steps 16.1-16.3

Define key names and JSON shapes for state, members, messages, seen message ids, and events.

**Deliverable:** Key helpers and parsers.

**Suggested files:** apps/rooms-service/src/redis

**Acceptance criteria**

- Keys use room:{roomId}:state, members, messages, seenMessageIds, and events
- State includes visibility, movie id, playback status, position, updatedAt, version, capacity, closed, and expiry
- Member includes user id, role, presence, and lastSeenAt
- Parsers reject malformed JSON

**Verification:** Unit tests.

**Testing:** Unit tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-21-02 — Room lifecycle API

Create, list, and close rooms.

### T-0166 — Create a private or public room

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-02 Room lifecycle API
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0165
- **Requirements:** FR-22; FR-23; NFR-02
- **Source:** 15_SEQUENCE_DIAGRAMS.md §5; 27 Phase 16 steps 16.4-16.9

Create an empty room for a movie, store the owner as OWNER, and apply the accepted TTL and capacity.

**Deliverable:** POST /rooms.

**Suggested files:** apps/rooms-service/src/http

**Acceptance criteria**

- visibility must be PRIVATE or PUBLIC
- Capacity is the accepted limit, proposed as 20
- TTL is the accepted inactivity duration
- Owner member role is OWNER and presence is ONLINE
- Playback starts PAUSED at position 0

**Verification:** Integration test against Redis.

**Testing:** Integration tests for both visibilities.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0167 — List open public rooms

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-02 Room lifecycle API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0166
- **Requirements:** FR-24
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 16 step 16.10

Return public rooms that are not closed.

**Deliverable:** GET /rooms/public.

**Suggested files:** apps/rooms-service/src/http

**Acceptance criteria**

- Private rooms are absent
- Closed rooms are absent
- The payload includes room id, movie id, and participant count

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** A public-room index key is required because scanning every Redis key is not an acceptable list implementation. Add a set of public room ids in this ticket.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0168 — Close a room as the owner

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-02 Room lifecycle API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0166, T-0009
- **Requirements:** FR-26
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 16 steps 16.19-16.21

Mark the room closed and shorten its TTL to the accepted post-close retention.

**Deliverable:** POST /rooms/:roomId/close.

**Suggested files:** apps/rooms-service/src/http

**Acceptance criteria**

- Only the owner succeeds
- A participant receives 403
- closed is true
- TTL matches the accepted close retention

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-21-03 — Invites and permissions

Invite participants and grant playback control.

### T-0169 — Store ROOM_INVITED in the accepted durable outbox

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0012, T-0047
- **Requirements:** FR-27; NFR-12
- **Source:** ADR-019; 27 Phase 16 step 16.15; G-04

Write a durable ROOM_INVITED event in the store chosen by the outbox decision.

**Deliverable:** Outbox insert used by the invite endpoint.

**Suggested files:** apps/rooms-service/src/outbox

**Acceptance criteria**

- The event includes eventId, recipientId, roomId, and type ROOM_INVITED
- It is not written only to Redis Pub/Sub
- Play and pause are not written here

**Verification:** Integration test reads the chosen store.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0170 — Invite a user to a room as a viewer

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0166, T-0169
- **Requirements:** FR-27; FR-30
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 16 steps 16.11-16.14

Let the owner invite a user. The default role is VIEWER.

**Deliverable:** POST /rooms/:roomId/invites.

**Suggested files:** apps/rooms-service/src/http

**Acceptance criteria**

- Non-owners receive 403
- Omitted role becomes VIEWER
- The invite is stored so the WebSocket join can see it
- A ROOM_INVITED outbox row is written
- Inviting beyond capacity is rejected

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0171 — Create and resolve a private invite URL token

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0170, T-0021
- **Requirements:** FR-28
- **Source:** 02_REQUIREMENTS.md FR-28; G-03

Implement the accepted invite URL mechanism.

**Deliverable:** Token create and resolve operations.

**Suggested files:** apps/rooms-service/src/invites

**Acceptance criteria**

- The token matches the decision
- A private room cannot be joined through a bare room id when the decision forbids it
- The token expires with the room or sooner
- The resolved role defaults to VIEWER

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0172 — Let the owner grant playback control

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0170
- **Requirements:** FR-29
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 16 steps 16.16-16.18

Change a participant role between VIEWER and CONTROLLER.

**Deliverable:** POST /rooms/:roomId/permissions.

**Suggested files:** apps/rooms-service/src/http

**Acceptance criteria**

- Only the owner succeeds
- CONTROLLER and VIEWER are the only target roles
- The owner cannot demote their own OWNER role in this endpoint
- The member record changes in Redis

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0173 — Test room create, invite, permission, close, TTL, and capacity

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0167, T-0168, T-0172, T-0171
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 16 step 16.22

Assemble the HTTP room tests named by the plan.

**Deliverable:** Rooms HTTP test suite.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- Private create, public create, owner-only invite, owner-only close, permission updates, TTL, and capacity are automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0198 — Publish pending room invite events to RabbitMQ

- **Epic:** E-21 Rooms control API
- **Feature:** F-21-03 Invites and permissions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0169, T-0192
- **Requirements:** NFR-12
- **Source:** 15_SEQUENCE_DIAGRAMS.md §13; ADR-019

Publish ROOM_INVITED the same way Users publishes friendship events.

**Deliverable:** Rooms outbox publisher.

**Suggested files:** apps/rooms-service/src/outbox

**Acceptance criteria**

- Broker downtime leaves the row pending
- The event is marked published only after confirm
- Duplicates remain possible and are safe for the consumer

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-22 — Rooms realtime session

Accept authenticated WebSocket joins and maintain presence.

### F-22-01 — WebSocket handshake and access

Authenticate the socket and enforce public or private access.

### T-0174 — Validate the WebSocket handshake locally

- **Epic:** E-22 Rooms realtime session
- **Feature:** F-22-01 WebSocket handshake and access
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0073, T-0165, T-0051, T-0083
- **Requirements:** FR-24; FR-25
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md WebSocket lifecycle; 15_SEQUENCE_DIAGRAMS.md §6; 22_SECURITY_MODEL.md Rooms

Require an access token and room id, and verify the JWT with JWKS.

**Deliverable:** Handshake on ws://localhost:4014/rooms.

**Suggested files:** apps/rooms-service/src/ws

**Acceptance criteria**

- Missing, expired, malformed, and invalid tokens are rejected
- Auth is not called per playback event after the handshake
- The socket is associated with user id, room id, and role after success

**Verification:** WebSocket tests.

**Testing:** Tests for each rejected token and one accepted token.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0175 — Enforce public, private, closed, and capacity rules on join

- **Epic:** E-22 Rooms realtime session
- **Feature:** F-22-01 WebSocket handshake and access
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0174, T-0171
- **Requirements:** FR-24; FR-25
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 17 steps 17.5-17.10

Load the room and allow the join only when access rules pass.

**Deliverable:** Join authorization.

**Suggested files:** apps/rooms-service/src/ws

**Acceptance criteria**

- Unknown and closed rooms are rejected
- A public room accepts an authenticated user while capacity remains
- A private room accepts only the owner, a current participant, or an invited user
- A full room is rejected

**Verification:** WebSocket integration tests.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0176 — Send the current room state on connect

- **Epic:** E-22 Rooms realtime session
- **Feature:** F-22-01 WebSocket handshake and access
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0175
- **Requirements:** FR-35
- **Source:** 15_SEQUENCE_DIAGRAMS.md §8; 27 Phase 17 step 17.11

Immediately send room.state_sync from Redis.

**Deliverable:** state_sync message.

**Suggested files:** apps/rooms-service/src/ws

**Acceptance criteria**

- The payload includes playback status, position, updatedAt, and version
- It is sent before any later live event
- Pub/Sub history is not replayed

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-22-02 — Presence and heartbeat

Track online, disconnected, and left participants.

### T-0177 — Track heartbeat, online, disconnected, and left presence

- **Epic:** E-22 Rooms realtime session
- **Feature:** F-22-02 Presence and heartbeat
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0176, T-0010
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 17 steps 17.12-17.17

Mark members online on connect, disconnected after the stale threshold, and left when the client sends room.leave.

**Deliverable:** Presence sweeper and broadcasts.

**Suggested files:** apps/rooms-service/src/presence

**Acceptance criteria**

- Connect sets ONLINE
- A heartbeat newer than the threshold keeps the member online
- The accepted stale threshold marks DISCONNECTED
- room.leave marks LEFT
- Presence updates are published to other instances

**Verification:** Integration test with a fake clock.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0178 — Test handshake, access denial, and reconnect sync

- **Epic:** E-22 Rooms realtime session
- **Feature:** F-22-02 Presence and heartbeat
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0177
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 17 step 17.18; 20_TESTING_AND_VALIDATION_PLAN.md §3

Cover valid handshake, invalid JWT, private denial, public join, stale heartbeat, and state sync.

**Deliverable:** WebSocket test suite.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- Each named case is automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-23 — Playback synchronization

Synchronize play, pause, and seek across Rooms instances from Redis state.

### F-23-01 — Playback commands

Apply authorized play, pause, and seek to the Redis sync point.

### T-0179 — Accept play, pause, and seek from owners and controllers

- **Epic:** E-23 Playback synchronization
- **Feature:** F-23-01 Playback commands
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0177, T-0011
- **Requirements:** FR-16; FR-17; FR-18; FR-19; FR-20; FR-31
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 18 steps 18.1-18.9; NFR-10

Update the Redis sync point for authorized playback commands and reject viewers.

**Deliverable:** Handlers for room.play, room.pause, and room.seek.

**Suggested files:** apps/rooms-service/src/playback

**Acceptance criteria**

- VIEWER commands are rejected
- Play stores PLAYING, a position, updatedAt, and the accepted version behavior
- Pause computes position from the previous sync point when status was PLAYING
- Seek stores the target position and supports both forward and backward targets
- Resume uses play from the stored position

**Verification:** Integration tests for each command and a viewer rejection.

**Testing:** Integration tests.

**Implementation notes:** NFR-07 has no numeric drift budget. Do not invent one. Position math is the sync-point rule from document 08.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0180 — Leave a room and stop participating in playback

- **Epic:** E-23 Playback synchronization
- **Feature:** F-23-01 Playback commands
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0177
- **Requirements:** FR-21
- **Source:** 02_REQUIREMENTS.md FR-21; 27 Phase 17 step 17.15 room.leave

Treat room.leave as the user stopping or exiting the shared playback session.

**Deliverable:** Leave behavior that removes the user from active control.

**Suggested files:** apps/rooms-service/src/playback

**Acceptance criteria**

- The member becomes LEFT
- Further play commands from that socket are rejected
- Other participants keep the current room state

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-23-02 — Cross-instance fan-out

Publish playback to other Rooms instances and resync from current state.

### T-0181 — Fan playback out through Redis Pub/Sub to local sockets only

- **Epic:** E-23 Playback synchronization
- **Feature:** F-23-02 Cross-instance fan-out
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** L
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0179
- **Requirements:** FR-34; NFR-04
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md Cross-instance synchronization; 15_SEQUENCE_DIAGRAMS.md §7; 27 Phase 18 steps 18.10-18.13

Publish playback on room:{roomId}:events and subscribe only to rooms that have sockets on this instance.

**Deliverable:** Pub/Sub adapter.

**Suggested files:** apps/rooms-service/src/pubsub

**Acceptance criteria**

- A command updates Redis state before publish
- An instance with no member in the room does not need that room's subscription
- Local sockets receive room.playback_state_changed
- The payload includes version when versions were accepted
- Pub/Sub is not treated as history

**Verification:** Two-process test.

**Testing:** Multi-process integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0182 — Prove cross-instance pause delivery and resync without replay

- **Epic:** E-23 Playback synchronization
- **Feature:** F-23-02 Cross-instance fan-out
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0181, T-0176
- **Requirements:** FR-34; FR-35; NFR-09; NFR-10
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 18 steps 18.15-18.17; 14_FAILURE_AND_RECOVERY_NOTES.md

Run two Rooms processes against one Redis and verify pause delivery and reconnect.

**Deliverable:** Automated two-instance test.

**Suggested files:** tests

**Acceptance criteria**

- User A on instance 1 pauses and user B on instance 2 receives it
- A reconnect receives Redis state
- Missed Pub/Sub messages are not replayed
- Simultaneous commands may resolve to the last processed state

**Verification:** Run the test.

**Testing:** The two-instance test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-24 — Room chat and reactions

Deliver ephemeral room chat and reactions on the same WebSocket.

### F-24-01 — Ephemeral chat

Store and broadcast room chat with idempotent retries.

### T-0183 — Store and broadcast idempotent room chat

- **Epic:** E-24 Room chat and reactions
- **Feature:** F-24-01 Ephemeral chat
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0177, T-0181, T-0009
- **Requirements:** FR-32; NFR-05; NFR-13
- **Source:** 08_ROOMS_REALTIME_AND_CHAT.md Chat retry; 27 Phase 19 steps 19.1-19.10

Accept chat.message from participants, reject invalid text, and deduplicate by message id.

**Deliverable:** Chat handler and Redis list.

**Suggested files:** apps/rooms-service/src/chat

**Acceptance criteria**

- Blank text and text over 1000 characters are rejected
- A non-participant is rejected
- The same author and messageId does not create a second visible message
- Messages use the accepted TTL and are removed when the room is cleaned up
- chat.message_created is broadcast through the room Pub/Sub path

**Verification:** Integration tests.

**Testing:** Integration tests for validation, duplicate, and TTL.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-24-02 — Reactions

Broadcast the allowed reaction set without a separate chat service.

### T-0184 — Broadcast the allowed room reactions

- **Epic:** E-24 Room chat and reactions
- **Feature:** F-24-02 Reactions
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0183
- **Requirements:** FR-33
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 19 steps 19.11-19.14

Accept like, laugh, wow, sad, and fire, and do not store them beyond the room TTL.

**Deliverable:** Reaction handler.

**Suggested files:** apps/rooms-service/src/chat

**Acceptance criteria**

- Other emoji names are rejected
- Participants receive chat.reaction_created
- No durable reaction table is created
- No separate Chat Service is introduced

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0185 — Test chat validation, duplicates, and cross-instance delivery

- **Epic:** E-24 Room chat and reactions
- **Feature:** F-24-02 Reactions
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 2 — Core backend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0184, T-0182
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 19 step 19.17; 20_TESTING_AND_VALIDATION_PLAN.md §5

Cover the chat cases named in the plan, including delivery between two Rooms processes.

**Deliverable:** Chat test suite.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- Validation, duplicate messageId, TTL, reaction validation, and cross-instance delivery are automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-25 — Room web experience

Let a person watch solo or in a room, invite others, and follow synchronized playback.

### F-25-01 — Room creation and lobby

Start solo, private, and public watches and invite friends.

### T-0186 — Start a solo watch or create a private or public room

- **Epic:** E-25 Room web experience
- **Feature:** F-25-01 Room creation and lobby
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0163, T-0166, T-0119
- **Requirements:** FR-16; FR-22; FR-23
- **Source:** 01_PRODUCT_OVERVIEW.md; 27 Phase 20 steps 20.1-20.5

Offer solo watch, private room, and public room from the movie detail page.

**Deliverable:** Create actions.

**Suggested files:** apps/web/src/pages/movie

**Acceptance criteria**

- Solo does not open a room WebSocket
- Private posts visibility PRIVATE
- Public posts visibility PUBLIC
- The signed-in user is required for all three

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0187 — List and join public rooms

- **Epic:** E-25 Room web experience
- **Feature:** F-25-01 Room creation and lobby
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0167, T-0129
- **Requirements:** FR-24
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 20 step 20.6

Show public rooms and join the selected one.

**Deliverable:** Public rooms page.

**Suggested files:** apps/web/src/pages/rooms

**Acceptance criteria**

- It calls GET /rooms/public
- Join navigates to the room page with that room id
- Private rooms are not listed

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0188 — Invite a friend in the app and copy an invite URL

- **Epic:** E-25 Room web experience
- **Feature:** F-25-01 Room creation and lobby
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0171, T-0137
- **Requirements:** FR-27; FR-28
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 20 steps 20.7-20.8

Let the owner invite a friend by user id and copy the accepted invite URL.

**Deliverable:** Invite controls.

**Suggested files:** apps/web/src/pages/room

**Acceptance criteria**

- In-app invite calls the invite endpoint
- Copy uses the URL shape from the invite decision
- A non-owner does not see owner actions

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-25-02 — Watch room player and controls

Bind the player to room state and disable viewer control.

### T-0189 — Show participants and owner permission controls

- **Epic:** E-25 Room web experience
- **Feature:** F-25-02 Watch room player and controls
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0172, T-0177
- **Requirements:** FR-29; FR-30
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 20 steps 20.9-20.10

Render participants and let the owner change VIEWER and CONTROLLER.

**Deliverable:** Participant panel.

**Suggested files:** apps/web/src/pages/room

**Acceptance criteria**

- Roles and presence are visible
- Owner can grant and revoke controller
- A viewer does not see the control

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0190 — Bind the room player to playback events and ignore stale versions

- **Epic:** E-25 Room web experience
- **Feature:** F-25-02 Watch room player and controls
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** L
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0181, T-0186, T-0011
- **Requirements:** FR-16; FR-17; FR-18; FR-19; FR-20; FR-31; FR-34
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 18 step 18.14; Phase 20 steps 20.11-20.17

Connect the room page to the WebSocket, send control events for owner and controller, and disable them for viewers.

**Deliverable:** Room player controls.

**Suggested files:** apps/web/src/pages/room

**Acceptance criteria**

- Owner and controller send play, pause, and seek
- Viewer controls are disabled
- An older version than the last applied version is ignored when versions are accepted
- Reconnect shows a banner and waits for room.state_sync before applying local control
- Solo watch does not send room events

**Verification:** Component tests with a fake socket.

**Testing:** Component tests.

**Implementation notes:** Actual media bytes are wired by the signed-playback ticket. This ticket can use the signed URL once that endpoint exists.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0191 — Build the room chat panel and reaction buttons

- **Epic:** E-25 Room web experience
- **Feature:** F-25-02 Watch room player and controls
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0184, T-0190
- **Requirements:** FR-32; FR-33
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 19 steps 19.15-19.16

Send chat with a client message id and send the allowed reactions.

**Deliverable:** Chat and reaction UI.

**Suggested files:** apps/web/src/pages/room

**Acceptance criteria**

- The client generates messageId
- Over-long text cannot be sent
- Only the five allowed reactions are buttons
- Incoming events render for the participant

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-26 — Notifications

Consume durable domain events at least once and show in-app notifications.

### F-26-01 — Broker topology and consumer

Deliver notification events with manual acknowledgement, two retries, and a dead-letter queue.

### T-0192 — Declare notification exchanges, queue, retry, and dead-letter queue

- **Epic:** E-26 Notifications
- **Feature:** F-26-01 Broker topology and consumer
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0042, T-0019
- **Requirements:** NFR-12
- **Source:** ADR-018; 27 Phase 21 steps 21.1-21.5

Create the domain exchange, dead-letter exchange, notifications.events, bindings, two retries, and notifications.events.dlq.

**Deliverable:** Topology bootstrap.

**Suggested files:** apps/notifications-service/src/topology

**Acceptance criteria**

- Routing keys ROOM_INVITED, FRIEND_REQUEST_CREATED, and FRIEND_REQUEST_ACCEPTED are bound
- A message is dead-lettered after two retries
- Bootstrap is idempotent

**Verification:** Integration test lists the queue and DLQ.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0194 — Consume notification events with manual acknowledgement

- **Epic:** E-26 Notifications
- **Feature:** F-26-01 Broker topology and consumer
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0192, T-0193
- **Requirements:** NFR-12
- **Source:** 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; 15_SEQUENCE_DIAGRAMS.md §12; 27 Phase 21 steps 21.9-21.11

Write an in-app notification or confirm a duplicate, then ACK. NACK transient failures.

**Deliverable:** Consumer.

**Suggested files:** apps/notifications-service/src/consumer

**Acceptance criteria**

- ACK happens only after the row is written or the event id is already processed
- A crash before ACK allows redelivery
- A duplicate event id does not create a second notification
- The fake push provider logs and cannot be described as real device push
- Two failures then the next failure dead-letters the message

**Verification:** Integration tests.

**Testing:** Tests for ACK, NACK, duplicate, and DLQ.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0197 — Add a dead-letter replay command

- **Epic:** E-26 Notifications
- **Feature:** F-26-01 Broker topology and consumer
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0194
- **Requirements:** —
- **Source:** 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md DLQ; 27 fixed decisions DLQ replay

Read selected dead-letter messages and republish them.

**Deliverable:** CLI that requires an explicit message id or a reviewed set.

**Suggested files:** scripts/mq

**Acceptance criteria**

- It does not replay the whole DLQ unless the operator passes an explicit all flag
- A replayed message keeps its event id so dedup still works
- The command logs what it republished

**Verification:** Integration test with one poisoned and one retried message.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0200 — Test acknowledgement, retry, dead-letter, and dedup

- **Epic:** E-26 Notifications
- **Feature:** F-26-01 Broker topology and consumer
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0194, T-0197, T-0111, T-0198
- **Requirements:** —
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §6

Cover the notification reliability scenarios named in the testing plan.

**Deliverable:** Notification reliability suite.

**Suggested files:** apps/notifications-service

**Acceptance criteria**

- Consumer crash before ACK, provider failure, two retries, DLQ, duplicate delivery, and read state are automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-26-02 — In-app notification API

Store and read in-app notifications with event deduplication.

### T-0193 — Create notification and dedup tables

- **Epic:** E-26 Notifications
- **Feature:** F-26-02 In-app notification API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0070, T-0019, T-0039
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 21 steps 21.6-21.8

Store processed event ids and in-app notification rows in the accepted database.

**Deliverable:** Migrations for processed_notification_events and notifications.

**Suggested files:** apps/notifications-service/migrations

**Acceptance criteria**

- event_id is unique
- notifications include recipient, type, payload, read_at, and created_at
- The Rooms Redis is not this store

**Verification:** Migration test.

**Testing:** Migration test.

**Implementation notes:** The plan allows PostgreSQL or SQLite. The proposal is a dedicated Notifications PostgreSQL database. If the deploy decision cannot afford another database, record the chosen substitute before coding.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0195 — List notifications and mark one as read

- **Epic:** E-26 Notifications
- **Feature:** F-26-02 In-app notification API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0194
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 21 steps 21.12-21.13

Return the caller's notifications and set read_at.

**Deliverable:** GET /notifications and POST /notifications/:id/read.

**Suggested files:** apps/notifications-service/src/http

**Acceptance criteria**

- Only the recipient's rows are returned
- Another user cannot mark them read
- Unread rows have null read_at

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0196 — Proxy notification reads through the Gateway

- **Epic:** E-26 Notifications
- **Feature:** F-26-02 In-app notification API
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0195, T-0115
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 21 step 21.14

Add authenticated Gateway routes for the notification API.

**Deliverable:** Proxied routes.

**Suggested files:** apps/gateway/src/routes/notifications

**Acceptance criteria**

- A token is required
- The paths match the notification service
- The consumer queue is not exposed

**Verification:** Route test.

**Testing:** HTTP test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-26-03 — Notification UI

Show notifications in the web shell.

### T-0199 — Show an in-app notification list

- **Epic:** E-26 Notifications
- **Feature:** F-26-03 Notification UI
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0196, T-0129
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 21 step 21.15

Show the caller's notifications and mark one read.

**Deliverable:** Notification bell and list.

**Suggested files:** apps/web/src/pages/notifications

**Acceptance criteria**

- It loads GET /notifications
- Mark read calls the read endpoint
- Friend request and room invite types render their payload fields
- It does not claim a device push was sent

**Verification:** Component test.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-27 — Direct media upload

Authorize resumable direct-to-object-storage uploads without proxying bytes through the API.

### F-27-01 — Upload authorization

Create metadata and presigned multipart URLs before bytes move.

### T-0201 — Add the Movie Service object-storage client

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-01 Upload authorization
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0044, T-0065, T-0017
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 22 steps 22.1-22.2; ADR-012

Configure an S3-compatible client from environment variables.

**Deliverable:** Storage client pointed at MinIO locally.

**Suggested files:** apps/movie-service/src/storage

**Acceptance criteria**

- Endpoint, bucket, and credentials come from config
- The client can start a multipart upload against kinvue-media
- No video byte is accepted by the Movie HTTP server in this client

**Verification:** Integration test lists the bucket.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0202 — Authorize a direct multipart upload after metadata exists

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-01 Upload authorization
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0201, T-0140, T-0144
- **Requirements:** FR-13; NFR-11
- **Source:** 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md; 27 Phase 22 steps 22.3-22.10

Validate the file, persist the upload row, move media state to uploading, and return presigned part URLs.

**Deliverable:** POST /admin/movies/:movieId/upload/init.

**Suggested files:** apps/movie-service/src/uploads

**Acceptance criteria**

- Content type must be video/mp4, video/quicktime, or video/x-matroska unless the media decision changed it
- Size must be greater than 1 MB and no larger than 25 GB
- The database row exists before URLs are returned
- The object key is movies/{movieId}/original/{uploadId}/{fileName}
- The response contains the upload id and one URL per part

**Verification:** Integration test against MinIO.

**Testing:** Integration tests for validation and URL count.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-27-02 — Upload completion and cleanup

Complete an upload into processing and abandon stale uploads.

### T-0203 — Complete the multipart upload and enqueue transcoding

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-02 Upload completion and cleanup
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0202, T-0042
- **Requirements:** FR-13
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 22 steps 22.11-22.15

Complete the object using the supplied part ETags, set processing, and publish media.transcode.

**Deliverable:** POST /admin/movies/:movieId/upload/complete.

**Suggested files:** apps/movie-service/src/uploads

**Acceptance criteria**

- Missing ETags fail without marking the movie ready
- Success sets the processing media state
- A transcode job contains jobId, movieId, originalKey, and attempt
- Movie Service does not read the video into its process

**Verification:** Integration test with a small multipart object.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0204 — Abandon stale multipart uploads

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-02 Upload completion and cleanup
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0202, T-0017
- **Requirements:** —
- **Source:** 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md Cleanup; 27 Phase 22 steps 22.16-22.18

Mark uploads older than the accepted threshold as abandoned and abort the multipart upload.

**Deliverable:** Cleanup job.

**Suggested files:** apps/movie-service/src/uploads

**Acceptance criteria**

- The threshold matches the decision, proposed as 24 hours
- A recent incomplete upload is kept
- Abort is called when the storage API supports it
- An almost-complete upload that is still inside the window is not deleted

**Verification:** Integration test with a clock.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0206 — Test metadata-first upload, completion, and cleanup

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-02 Upload completion and cleanup
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0203, T-0204
- **Requirements:** —
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §9

Cover interrupted parts, size and type rejection, URL expiry, and abandoned cleanup.

**Deliverable:** Upload integration suite.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- The testing plan's upload scenarios that are specified for v1 are automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-27-03 — Admin upload UI

Upload parts directly to object storage and retry only failed parts.

### T-0205 — Upload parts directly to object storage and retry failed parts

- **Epic:** E-27 Direct media upload
- **Feature:** F-27-03 Admin upload UI
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0203, T-0160
- **Requirements:** FR-13; NFR-11
- **Source:** ADR-010; ADR-012; 27 Phase 22 steps 22.19-22.21

Send file parts to the presigned URLs, not through the Gateway, and retry only failed parts.

**Deliverable:** Admin upload panel.

**Suggested files:** apps/web/src/pages/admin

**Acceptance criteria**

- Init and complete go through the Gateway
- Part bytes do not go through the Gateway
- A failed part retries without restarting completed parts
- The UI shows uploading and processing states

**Verification:** Component test with fake URLs and a browser network assertion.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-28 — Transcoding

Turn completed uploads into HLS renditions and record READY or PROCESSING_FAILED.

### F-28-01 — Transcode job processing

Generate the v1 HLS ladder from the original object.

### T-0207 — Declare the media.transcode queue and job contract

- **Epic:** E-28 Transcoding
- **Feature:** F-28-01 Transcode job processing
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0203, T-0074
- **Requirements:** —
- **Source:** ADR-013; 27 Phase 23 steps 23.1-23.3

Consume one local job at a time from media.transcode using the documented payload.

**Deliverable:** Queue consumer skeleton that validates the payload.

**Suggested files:** apps/transcode-worker/src/queue

**Acceptance criteria**

- Invalid payloads are not acknowledged as success
- The worker does not take a second job until the first settles
- The queue provides backpressure rather than starting unbounded ffmpeg processes

**Verification:** Integration test publishes two jobs and observes serial handling.

**Testing:** Integration test.

**Implementation notes:** Using RabbitMQ for transcode jobs is the plan's choice. The HLA only says a transcode queue. This ticket records that choice.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0208 — Generate the HLS ladder and write it back to object storage

- **Epic:** E-28 Transcoding
- **Feature:** F-28-01 Transcode job processing
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** L
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0207, T-0075, T-0017
- **Requirements:** FR-13
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 23 steps 23.4-23.7

Download the original to a temp directory, create 1080p, 720p, and 480p HLS, and upload movies/{movieId}/hls/.

**Deliverable:** FFmpeg pipeline.

**Suggested files:** apps/transcode-worker/src/ffmpeg

**Acceptance criteria**

- Renditions match the accepted ladder
- A master playlist is uploaded
- Temp files are removed after success and failure
- The original is retained
- The worker does not send segment bytes to the Gateway

**Verification:** Run against the fixture video.

**Testing:** Fixture test in the next ticket can share this harness; this ticket includes one happy-path test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0211 — Verify a fixture video produces a playable HLS playlist

- **Epic:** E-28 Transcoding
- **Feature:** F-28-01 Transcode job processing
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0210
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 23 steps 23.15-23.16; 20_TESTING_AND_VALIDATION_PLAN.md §10

Transcode a short fixture and open the master playlist.

**Deliverable:** Fixture and test.

**Suggested files:** tests/fixtures

**Acceptance criteria**

- The fixture is small and committed
- The master playlist references the expected renditions
- A worker crash test shows the job is retried
- Poison media reaches the failure state

**Verification:** Run the fixture test.

**Testing:** The fixture test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-28-02 — Movie processing callbacks

Move a movie to READY or PROCESSING_FAILED only after a durable worker result.

### T-0209 — Mark a movie READY only after the HLS master exists

- **Epic:** E-28 Transcoding
- **Feature:** F-28-02 Movie processing callbacks
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0208, T-0139
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 23 steps 23.8-23.10 and 23.14

Add an internal callback that verifies the master key and sets the ready media state.

**Deliverable:** POST /internal/movies/:movieId/transcode-complete.

**Suggested files:** apps/movie-service/src/internal

**Acceptance criteria**

- The route is not on the Gateway
- Missing master key does not set ready
- The worker ACKs only after this call succeeds
- A repeated callback is safe

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0210 — Retry transcoding three times and then record failure

- **Epic:** E-28 Transcoding
- **Feature:** F-28-02 Movie processing callbacks
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0209, T-0017
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 23 steps 23.11-23.14; 14_FAILURE_AND_RECOVERY_NOTES.md worker dies

Retry the job up to the accepted attempt count and then call the failure callback.

**Deliverable:** Retry policy and POST /internal/movies/:movieId/transcode-failed.

**Suggested files:** apps/transcode-worker/src/ffmpeg

**Acceptance criteria**

- The accepted count is three unless the decision changed it
- The movie stays in processing during retries
- The terminal state is PROCESSING_FAILED or the diagram's failure state
- ACK happens only after the durable state update

**Verification:** Integration test with a corrupt input.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-29 — Signed media playback

Authorize short-lived media access and play HLS from CDN or MinIO, not from application servers.

### F-29-01 — Media access API

Return a short-lived signed playlist URL for playable movies.

### T-0212 — Return a short-lived signed HLS URL

- **Epic:** E-29 Signed media playback
- **Feature:** F-29-01 Media access API
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0209, T-0017, T-0201
- **Requirements:** FR-16
- **Source:** 22_SECURITY_MODEL.md Media; 15_SEQUENCE_DIAGRAMS.md §11; 27 Phase 24 steps 24.1-24.5

Authorize an authenticated user and return a signed master playlist URL for a ready or published movie.

**Deliverable:** POST /movies/:movieId/media-access.

**Suggested files:** apps/movie-service/src/playback

**Acceptance criteria**

- Anonymous callers are rejected
- Movies outside the playable states are rejected
- The URL expires in the accepted TTL, proposed as 10 minutes
- The response does not contain segment bytes

**Verification:** Integration test.

**Testing:** Integration tests for unauthorized, bad state, and success.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-29-02 — Player media loading

Load HLS from the signed URL without proxying segments through the API.

### T-0213 — Load HLS from the signed URL

- **Epic:** E-29 Signed media playback
- **Feature:** F-29-02 Player media loading
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0212, T-0190
- **Requirements:** FR-16; FR-21
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 24 steps 24.6-24.8

Request media access before attaching the playlist to the player, for both solo and room watch.

**Deliverable:** HLS playback integration.

**Suggested files:** apps/web/src/player

**Acceptance criteria**

- The player requests media-access first
- Segments are requested from the signed host, not from port 4000 or 4003
- Stop or exit disposes the player
- A viewer still receives room playback changes while their own control stays disabled

**Verification:** Component test with a fake playlist and a network log.

**Testing:** Component test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0214 — Assert application services do not proxy media bytes

- **Epic:** E-29 Signed media playback
- **Feature:** F-29-02 Player media loading
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0213, T-0203
- **Requirements:** —
- **Source:** ADR-010; 27 Phase 24 step 24.8; NFR from media bandwidth section

Add a regression check that Gateway and Movie routes do not stream object bytes.

**Deliverable:** An automated architecture test.

**Suggested files:** tests

**Acceptance criteria**

- No Gateway or Movie route returns video/MP2T or a playlist body from an object read in the request path
- Signed URL generation is allowed
- Direct unsigned bucket access is denied in the local bucket policy where the storage API allows that policy

**Verification:** Run the test.

**Testing:** The architecture test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-30 — Scheduled watch sessions

Schedule a future room for a movie and invitees, then open it when due.

### F-30-01 — Schedule persistence

Store a future watch, its movie, and its invitees durably.

### T-0215 — Store scheduled watches and invitees in the accepted database

- **Epic:** E-30 Scheduled watch sessions
- **Feature:** F-30-01 Schedule persistence
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0018, T-0138
- **Requirements:** FR-36; FR-37
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 25 steps 25.1-25.4; G-05

Create scheduled_rooms and the invitee rows required by FR-37.

**Deliverable:** Migrations.

**Suggested files:** apps/movie-service/migrations

**Acceptance criteria**

- Statuses are SCHEDULED, OPENED, and CANCELLED
- movie id, owner id, visibility, and scheduled time are stored
- Invitee user ids are stored
- The rows survive a Redis flush in the test

**Verification:** Migration test.

**Testing:** Migration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0216 — Create, list, and cancel scheduled watches

- **Epic:** E-30 Scheduled watch sessions
- **Feature:** F-30-01 Schedule persistence
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0215, T-0150
- **Requirements:** FR-36; FR-37
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 25 steps 25.5-25.7

Let the owner schedule a published movie with invitees and cancel it before it opens.

**Deliverable:** POST /scheduled-rooms, GET /scheduled-rooms, and POST /scheduled-rooms/:id/cancel.

**Suggested files:** apps/movie-service/src/schedules

**Acceptance criteria**

- A past time is rejected
- Invitees are stored
- Only the owner can cancel
- Cancelled is not opened later

**Verification:** Integration tests.

**Testing:** Integration tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-30-02 — Schedule opener

Open a Redis room when the schedule is due and notify invitees.

### T-0217 — Open a Redis room when a schedule is due and notify invitees

- **Epic:** E-30 Scheduled watch sessions
- **Feature:** F-30-02 Schedule opener
- **Priority:** P1
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0216, T-0166, T-0198
- **Requirements:** FR-36; FR-37
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 25 steps 25.8-25.10

Create the room, mark the schedule OPENED only after Redis succeeds, and emit invite events.

**Deliverable:** Scheduler.

**Suggested files:** apps/rooms-service/src/scheduler

**Acceptance criteria**

- A due schedule creates a room with the saved visibility and movie
- OPENED is not set if Redis fails
- Each invitee gets a ROOM_INVITED event
- Running the job twice does not open a second room

**Verification:** Integration test.

**Testing:** Integration test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0219 — Test schedule create, cancel, due open, and invite notification

- **Epic:** E-30 Scheduled watch sessions
- **Feature:** F-30-02 Schedule opener
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 4 — Integrations
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0217, T-0194
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 25 step 25.13

Cover the four schedule scenarios named in the plan.

**Deliverable:** Schedule integration suite.

**Suggested files:** tests

**Acceptance criteria**

- Create, cancel, due open, and invitee notification are automated

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-30-03 — Schedule UI

Create and review scheduled watches from the web app.

### T-0218 — Build the schedule form and scheduled watches page

- **Epic:** E-30 Scheduled watch sessions
- **Feature:** F-30-03 Schedule UI
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 3 — Frontend
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0216, T-0163, T-0119
- **Requirements:** FR-36; FR-37
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 25 steps 25.11-25.12

Let a user schedule a watch from the movie page and review upcoming watches.

**Deliverable:** Schedule form and page.

**Suggested files:** apps/web/src/pages/schedule

**Acceptance criteria**

- The form sends movie, time, visibility, and invitees
- The list calls GET /scheduled-rooms
- Cancel is available to the owner

**Verification:** Component tests.

**Testing:** Component tests.

**Implementation notes:** Gateway routes for scheduled rooms are part of this ticket if they were not in the earlier route table. Add POST, GET, and cancel proxies.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-31 — Observability

Expose the metrics required to make scaling decisions and dashboard the core workloads.

### F-31-01 — Service metrics

Expose the workload metrics named in the observability document.

### T-0220 — Expose HTTP rate, error, and latency metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0056, T-0059, T-0062, T-0065, T-0068, T-0071
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Global and Gateway; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Add request rate, error rate, and latency histograms to every HTTP service.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/gateway

**Acceptance criteria**

- Each service /metrics includes request count, error count, and p95-capable latency buckets.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0221 — Expose Rooms WebSocket and Redis metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** rooms-service
- **MVP class:** MVP
- **Dependencies:** T-0181, T-0177
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Rooms and Chat; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Add active sockets, active rooms, playback commands, outgoing events, reconnects, resync latency, Redis latency, and Pub/Sub latency.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/rooms-service

**Acceptance criteria**

- The metric names from Phase 26 step 26.4 exist.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0222 — Expose Auth registration and login metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0096, T-0086
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Auth; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Count logins, registrations, saga states, retries, compensations, and failed logins.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- A failed login and a compensation increment the matching counters.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0223 — Expose Users query metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** users-service
- **MVP class:** MVP
- **Dependencies:** T-0112
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Users; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Measure profile reads, friendship operations, user search latency, and Mongo latency.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/users-service

**Acceptance criteria**

- A search request records latency.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0224 — Expose search and reconciliation metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0156
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Movie/Search; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Measure search QPS, search latency, indexing latency, reconciliation lag, and Meilisearch failures.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/movie-service

**Acceptance criteria**

- A failed Meilisearch call increments the failure counter.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0225 — Expose RabbitMQ queue metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** notifications-service
- **MVP class:** MVP
- **Dependencies:** T-0200
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md RabbitMQ; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Expose publish rate, consume rate, unacked count, queue depth, retry count, DLQ depth, and oldest message age.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/notifications-service

**Acceptance criteria**

- A dead-lettered message increases DLQ depth.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0226 — Expose upload and transcode metrics

- **Epic:** E-31 Observability
- **Feature:** F-31-01 Service metrics
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** transcode-worker
- **MVP class:** MVP
- **Dependencies:** T-0211, T-0206
- **Requirements:** —
- **Source:** 21_OBSERVABILITY_AND_METRICS.md Media; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26

Measure upload failures, abandoned uploads, transcode duration, queue depth, failed transcodes, and stream-start latency.

**Deliverable:** Prometheus metrics on the existing /metrics endpoint.

**Suggested files:** apps/transcode-worker

**Acceptance criteria**

- A failed transcode increments the failure counter. CDN hit ratio may be a placeholder until a CDN exists.
- Metrics do not include raw tokens or emails
- The endpoint stays on the existing path

**Verification:** Scrape /metrics and find the new names.

**Testing:** A test that a sample operation moves a counter or histogram.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-31-02 — Dashboards and runbook

Chart overview, rooms, and media, and explain how to read them.

### T-0227 — Scrape every service from Prometheus

- **Epic:** E-31 Observability
- **Feature:** F-31-02 Dashboards and runbook
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0045, T-0220
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26 step 26.10

Add scrape targets for Gateway, Auth, Users, Movie, Rooms, Notifications, and the worker.

**Deliverable:** Prometheus config.

**Suggested files:** infra/prometheus/prometheus.yml

**Acceptance criteria**

- Each target becomes up
- Scrape does not require a secret in the repository

**Verification:** Open the Prometheus targets page.

**Testing:** Manual target check recorded in the runbook.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0228 — Create the KinVue Overview dashboard

- **Epic:** E-31 Observability
- **Feature:** F-31-02 Dashboards and runbook
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0227, T-0222, T-0223
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26 step 26.11

Chart request rate, error rate, and latency for the HTTP services.

**Deliverable:** Grafana dashboard KinVue Overview.

**Suggested files:** infra/grafana

**Acceptance criteria**

- The dashboard is provisioned from a file
- It loads in local Grafana
- It does not hard-code a production host

**Verification:** Open the dashboard.

**Testing:** Grafana provisioning starts without error.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0229 — Create the KinVue Rooms dashboard

- **Epic:** E-31 Observability
- **Feature:** F-31-02 Dashboards and runbook
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0221, T-0227
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26 step 26.12

Chart sockets, rooms, playback, reconnects, and Redis latency.

**Deliverable:** Grafana dashboard KinVue Rooms.

**Suggested files:** infra/grafana

**Acceptance criteria**

- The Phase 26 room metric names are panels or explicitly marked absent
- The dashboard is provisioned from a file

**Verification:** Open the dashboard after a two-client room test.

**Testing:** Provisioning check.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Can be built beside the overview dashboard.

### T-0230 — Create the KinVue Media dashboard

- **Epic:** E-31 Observability
- **Feature:** F-31-02 Dashboards and runbook
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0226, T-0227
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26 step 26.13

Chart uploads, transcode duration, failures, and stream-start latency.

**Deliverable:** Grafana dashboard KinVue Media.

**Suggested files:** infra/grafana

**Acceptance criteria**

- Failed transcodes and queue depth are visible
- CDN hit ratio is labeled placeholder until a CDN is provisioned

**Verification:** Open the dashboard.

**Testing:** Provisioning check.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0231 — Write the observability runbook

- **Epic:** E-31 Observability
- **Feature:** F-31-02 Dashboards and runbook
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0228, T-0229, T-0230
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 26 step 26.14; 21_OBSERVABILITY_AND_METRICS.md Capacity decision rule

Explain which dashboard answers which saturation question and forbid scaling claims that are not tied to a measurement.

**Deliverable:** Runbook.

**Suggested files:** docs/runbooks/observability.md

**Acceptance criteria**

- It names the three dashboards
- It repeats the rule that a server count is justified by measured saturation and an NFR miss
- It tells an operator where request ids appear in logs

**Verification:** A second engineer can find a room socket panel from the runbook alone.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-32 — Security hardening

Enforce the v1 security model on every public ingress.

### F-32-01 — Transport and input protection

Terminate TLS, restrict browser origins, limit body size, and keep internal routes private.

### T-0233 — Keep internal routes off the public Gateway

- **Epic:** E-32 Security hardening
- **Feature:** F-32-01 Transport and input protection
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0101, T-0209, T-0120
- **Requirements:** —
- **Source:** 22_SECURITY_MODEL.md Service identity; G-15

Confirm profile creation and transcode callbacks are unreachable through the Gateway and are limited to the private network.

**Deliverable:** A route audit and a negative test.

**Suggested files:** apps/gateway/src/routes

**Acceptance criteria**

- Gateway returns 404 for /internal/users/profiles and the transcode callbacks
- Mutual TLS is not added
- The private-network assumption is written next to the routes

**Verification:** HTTP test against the Gateway.

**Testing:** Negative route test.

**Implementation notes:** If the deploy decision cannot provide a private network, stop and add the proposed internal token in a follow-up. Do not invent mutual TLS.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0234 — Limit request body size and validate external payloads

- **Epic:** E-32 Security hardening
- **Feature:** F-32-01 Transport and input protection
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0122, T-0052
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 steps 27.10-27.12

Reject oversized JSON bodies and payloads that fail the shared contracts.

**Deliverable:** Body limit and validation middleware.

**Suggested files:** apps/gateway

**Acceptance criteria**

- A body over the documented limit returns 400
- External write endpoints use the contract validators
- Upload part bytes are not subject to the JSON limit because they do not pass through the Gateway

**Verification:** HTTP tests.

**Testing:** HTTP tests.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0235 — Configure CORS and production TLS

- **Epic:** E-32 Security hardening
- **Feature:** F-32-01 Transport and input protection
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** gateway
- **MVP class:** MVP
- **Dependencies:** T-0116, T-0024
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 steps 27.1 and 27.15; 22_SECURITY_MODEL.md TLS

Allow only the configured web origin and document TLS termination for the API and the Rooms WebSocket.

**Deliverable:** CORS middleware and deployment notes for HTTPS and WSS.

**Suggested files:** apps/gateway/src/cors

**Acceptance criteria**

- A disallowed origin is rejected
- Local development origin is configurable
- The notes require TLS in the deployed environment and do not require TLS for localhost

**Verification:** CORS unit test.

**Testing:** Unit test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-32-02 — Authorization regression tests

Prove private rooms, viewer control, admin routes, and media access stay denied when they should.

### T-0237 — Add authorization regression tests for rooms, admin, and media

- **Epic:** E-32 Security hardening
- **Feature:** F-32-02 Authorization regression tests
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0178, T-0179, T-0120, T-0212, T-0202
- **Requirements:** FR-25; FR-30; FR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 step 27.16

Deny a direct private join, viewer playback, a non-admin movie call, an expired JWT, invalid media access, and a bad upload type.

**Deliverable:** Security regression suite.

**Suggested files:** tests

**Acceptance criteria**

- Each named denial is automated
- A successful admin and owner path still works so the tests are not inverted

**Verification:** Run the suite.

**Testing:** The suite this ticket adds.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-32-03 — Security operations

Scan secrets and dependencies, and write the security runbook.

### T-0236 — Audit Auth logs for credential leakage

- **Epic:** E-32 Security hardening
- **Feature:** F-32-03 Security operations
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** auth-service
- **MVP class:** MVP
- **Dependencies:** T-0089, T-0049
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 step 27.6

Make sure login, registration, refresh, and logout paths do not log passwords, hashes, or tokens.

**Deliverable:** A test that captures log lines from those handlers.

**Suggested files:** apps/auth-service

**Acceptance criteria**

- The test fails if those secrets appear
- Redaction is covered for bearer tokens and refresh tokens

**Verification:** Run the test.

**Testing:** Log capture test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0238 — Add secret scanning and dependency scanning to CI

- **Epic:** E-32 Security hardening
- **Feature:** F-32-03 Security operations
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** ci
- **MVP class:** MVP
- **Dependencies:** T-0030, T-0240
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 steps 27.7-27.9

Fail CI when a committed secret pattern or a high-severity dependency advisory is found.

**Deliverable:** CI jobs.

**Suggested files:** .github/workflows/ci.yml

**Acceptance criteria**

- A fixture secret in a test file that is meant to fail is detected by a dry run
- .env.example does not trip the scanner
- The scanner version is pinned

**Verification:** Run the workflow locally or in CI.

**Testing:** Scanner dry run.

**Implementation notes:** The tool is not named by the docs. Use a widely available scanner and record the choice.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0239 — Write the security runbook

- **Epic:** E-32 Security hardening
- **Feature:** F-32-03 Security operations
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0237, T-0235, T-0023
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 27 step 27.17; 22_SECURITY_MODEL.md; G-16

Document token lifetimes, admin bootstrap, upload limits, private-room rules, and the deferred password reset and email verification gaps.

**Deliverable:** Security runbook.

**Suggested files:** docs/runbooks/security.md

**Acceptance criteria**

- It states there is no password reset in v1
- It states signed URLs are not DRM
- It points at the authorization tests

**Verification:** Read-through by a second engineer.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-33 — CI pipeline

Run format, lint, typecheck, unit, integration, and browser smoke checks on every change.

### F-33-01 — Pull-request validation

Run install, format, lint, typecheck, and unit tests in CI.

### T-0240 — Run format, lint, typecheck, and unit tests in CI

- **Epic:** E-33 CI pipeline
- **Feature:** F-33-01 Pull-request validation
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** S
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** ci
- **MVP class:** MVP
- **Dependencies:** T-0036, T-0035, T-0054
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 28 steps 28.1-28.8

Create the GitHub Actions workflow that installs Node 20 and pnpm and runs the fast checks.

**Deliverable:** CI workflow.

**Suggested files:** .github/workflows/ci.yml

**Acceptance criteria**

- Install uses the lockfile
- Format, lint, typecheck, and unit tests each have a step
- The workflow fails when a unit test fails

**Verification:** Push a branch or run the workflow with a local action runner.

**Testing:** The workflow itself.

**Implementation notes:** GitHub Actions is the plan's CI provider. Document 18 had left the provider open.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-33-02 — Integration and browser CI

Run service integration tests and the Playwright smoke test.

### T-0241 — Run integration tests with Compose in CI

- **Epic:** E-33 CI pipeline
- **Feature:** F-33-02 Integration and browser CI
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** ci
- **MVP class:** MVP
- **Dependencies:** T-0240, T-0047, T-0081
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 28 steps 28.9-28.10

Start the local infrastructure and run service integration tests.

**Deliverable:** CI integration job.

**Suggested files:** .github/workflows/ci.yml

**Acceptance criteria**

- Compose starts the data services
- The job does not depend on a production cloud account
- A failing integration test fails the job

**Verification:** Run the job.

**Testing:** The integration suite already required by earlier tickets.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0242 — Run the Playwright smoke test in CI and keep failure artifacts

- **Epic:** E-33 CI pipeline
- **Feature:** F-33-02 Integration and browser CI
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** ci
- **MVP class:** MVP
- **Dependencies:** T-0241, T-0130
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 28 steps 28.11-28.13

Run the browser smoke test and upload traces when it fails.

**Deliverable:** CI browser job.

**Suggested files:** .github/workflows/ci.yml

**Acceptance criteria**

- Playwright smoke runs
- Failure artifacts are uploaded
- Branch protection is documented as a repository setting the operator must enable

**Verification:** Inspect a failed run's artifacts.

**Testing:** Smoke spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-34 — End-to-end journeys

Automate the documented user journeys from registration through signed playback.

### F-34-01 — Identity and social journeys

Cover registration, login, profile, search, and friendship end to end.

### T-0243 — E2E register a user

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-01 Identity and social journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0132, T-0096
- **Requirements:** FR-01
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A new email and username reach an ACTIVE identity and a profile.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A new email and username reach an ACTIVE identity and a profile.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0244 — E2E log in

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-01 Identity and social journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0133, T-0243
- **Requirements:** FR-02
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The registered user receives a session and lands on search.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The registered user receives a session and lands on search.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0245 — E2E edit a profile

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-01 Identity and social journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0134, T-0244
- **Requirements:** FR-04
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

Display name and preferences change and reload.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- Display name and preferences change and reload.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0246 — E2E search for a user

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-01 Identity and social journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0135, T-0245
- **Requirements:** FR-05
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A second user is found only after the minimum query length.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A second user is found only after the minimum query length.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0247 — E2E friend request and accept

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-01 Identity and social journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0136, T-0137, T-0246
- **Requirements:** FR-06; FR-07; FR-08
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

Both users see the friendship after accept.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- Both users see the friendship after accept.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-34-02 — Catalog journeys

Cover publish, search, and watchlist end to end.

### T-0248 — E2E admin creates and publishes a movie

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-02 Catalog journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0161, T-0232
- **Requirements:** FR-12; FR-14
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A draft becomes published and appears in search after indexing.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A draft becomes published and appears in search after indexing.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0249 — E2E search for a movie

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-02 Catalog journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0162, T-0248
- **Requirements:** FR-10; NFR-06
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The published title is found and a draft title is not.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The published title is found and a draft title is not.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0250 — E2E save a movie

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-02 Catalog journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0164, T-0249
- **Requirements:** FR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The movie appears on the watchlist and can be removed.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The movie appears on the watchlist and can be removed.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-34-03 — Room and media journeys

Cover rooms, realtime, notifications, upload, and signed playback end to end.

### T-0251 — E2E start and stop solo playback

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0213, T-0250
- **Requirements:** FR-16; FR-21
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

Solo watch requests media access and does not open a room socket.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- Solo watch requests media access and does not open a room socket.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0252 — E2E create a private room

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0186, T-0248
- **Requirements:** FR-22
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The owner enters a private room for the movie.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The owner enters a private room for the movie.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0253 — E2E invited friend joins a private room

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0188, T-0252, T-0247
- **Requirements:** FR-25; FR-27
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The invited friend joins and a stranger does not.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The invited friend joins and a stranger does not.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0254 — E2E join a public room

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0187, T-0248
- **Requirements:** FR-23; FR-24
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A second authenticated user joins from the public list.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A second authenticated user joins from the public list.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0255 — E2E grant controller permission

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0189, T-0253
- **Requirements:** FR-29; FR-30
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The owner promotes a viewer to controller.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The owner promotes a viewer to controller.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0256 — E2E synchronized play, pause, and seek

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0190, T-0255
- **Requirements:** FR-31; FR-34; NFR-04
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The other browser observes play, pause, and both seek directions.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The other browser observes play, pause, and both seek directions.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0257 — E2E viewer cannot control playback

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0256
- **Requirements:** FR-30
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The viewer controls stay disabled and no playback command is accepted.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The viewer controls stay disabled and no playback command is accepted.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0258 — E2E room chat

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0191, T-0256
- **Requirements:** FR-32; NFR-05
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A message appears for the other participant.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A message appears for the other participant.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0259 — E2E room reaction

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0191, T-0258
- **Requirements:** FR-33
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

A reaction appears for the other participant.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- A reaction appears for the other participant.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0260 — E2E reconnect resync

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0190, T-0256
- **Requirements:** FR-35
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

After a socket drop, the client applies state_sync and not a replay.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- After a socket drop, the client applies state_sync and not a replay.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0261 — E2E friend and invite notifications

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0199, T-0247, T-0253
- **Requirements:** NFR-12
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

Both event types become visible in the notification list.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- Both event types become visible in the notification list.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0262 — E2E upload a fixture and play signed HLS

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0205, T-0213, T-0211
- **Requirements:** FR-13; NFR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29

The fixture becomes playable through a signed URL.

**Deliverable:** A Playwright journey.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The fixture becomes playable through a signed URL.
- The test uses the Gateway and the public Rooms socket, not internal ports, for user actions
- It cleans up its users and movies

**Verification:** Run the spec.

**Testing:** The Playwright spec.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0263 — Run the full local end-to-end journey suite

- **Epic:** E-34 End-to-end journeys
- **Feature:** F-34-03 Room and media journeys
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/e2e
- **MVP class:** MVP
- **Dependencies:** T-0243, T-0244, T-0245, T-0246, T-0247, T-0248, T-0249, T-0250, T-0251, T-0252, T-0253, T-0254, T-0255, T-0256, T-0257, T-0258, T-0259, T-0260, T-0261, T-0262
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 29 step 29.21

Run every journey spec in one command and record the result.

**Deliverable:** A single test:e2e command that includes the journey specs.

**Suggested files:** tests/e2e

**Acceptance criteria**

- The command runs all Phase 29 journeys
- One failure fails the command

**Verification:** pnpm test:e2e

**Testing:** The full suite.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-35 — Failure and recovery tests

Prove the failure behavior already chosen in the architecture pack.

### F-35-01 — Process failure tests

Restart Gateway, Auth, Users, and Rooms and confirm the documented recovery.

### T-0264 — Restart Gateway and confirm no business state lived there

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-01 Process failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0122
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Gateway; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Stop one Gateway process during a proxied read and confirm the next request succeeds through a remaining process or a restart.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Stop one Gateway process during a proxied read and confirm the next request succeeds through a remaining process or a restart.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0265 — Use an existing JWT after Auth restarts

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-01 Process failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0086, T-0115
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Auth Service instance dies; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Restart Auth and repeat an authenticated profile read without refreshing.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Restart Auth and repeat an authenticated profile read without refreshing.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0266 — Registration does not succeed while Users is down

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-01 Process failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0096
- **Requirements:** —
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §7; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Stop Users and confirm the client never receives 201.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Stop Users and confirm the client never receives 201.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0267 — Unique email rejects a concurrent registration race

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-01 Process failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0091
- **Requirements:** —
- **Source:** 06_AUTH_AND_REGISTRATION.md Unique email; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Issue two registrations for one email and confirm only one identity remains.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Issue two registrations for one email and confirm only one identity remains.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0268 — Resync after a Rooms instance is killed

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-01 Process failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0182
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Rooms instance dies; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Kill one Rooms process and confirm the client reconnects and receives state_sync.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Kill one Rooms process and confirm the client reconnects and receives state_sync.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-35-02 — Dependency failure tests

Exercise Redis, Meilisearch, RabbitMQ, notification acknowledgement, and transcode failure.

### T-0269 — Document local Redis loss versus production HA

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0166, T-0024
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Redis primary dies; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Restart local Redis, observe that ephemeral room state can disappear, and write that production requires HA.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Restart local Redis, observe that ephemeral room state can disappear, and write that production requires HA.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0270 — Reconnect after a Pub/Sub interruption without replay

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0182
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Pub/Sub event lost; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Interrupt Pub/Sub and confirm the client heals by reading current state.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Interrupt Pub/Sub and confirm the client heals by reading current state.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0271 — Keep the movie row when Meilisearch is down

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0156
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Meilisearch failure; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Publish while Meilisearch is stopped and confirm PostgreSQL remains published and a later reconcile repairs search.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Publish while Meilisearch is stopped and confirm PostgreSQL remains published and a later reconcile repairs search.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0272 — Keep the outbox pending while RabbitMQ is down

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0111
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md RabbitMQ failure; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Stop RabbitMQ during publish and confirm the outbox row stays pending and publishes later.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Stop RabbitMQ during publish and confirm the outbox row stays pending and publishes later.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0273 — Redeliver a notification when the consumer crashes before ACK

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0200
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Notification consumer; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Crash the consumer after the side effect window and confirm redelivery and dedup.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Crash the consumer after the side effect window and confirm redelivery and dedup.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0274 — Retry a transcode after the worker dies

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0211
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Transcoding worker dies; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Kill the worker mid-job and confirm retry and a terminal state.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Kill the worker mid-job and confirm retry and a terminal state.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0275 — Retry only the failed upload part

- **Epic:** E-35 Failure and recovery tests
- **Feature:** F-35-02 Dependency failure tests
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0206, T-0205
- **Requirements:** —
- **Source:** 14_FAILURE_AND_RECOVERY_NOTES.md Admin upload interrupted; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 30

Fail one part and confirm completed parts are not uploaded again.

**Deliverable:** An automated failure test or, where the pack only requires documentation, a runbook section plus a local command log.

**Suggested files:** tests/failure

**Acceptance criteria**

- Fail one part and confirm completed parts are not uploaded again.
- The expected user-visible result from the failure notes is asserted or written down

**Verification:** Run the test or follow the recorded command.

**Testing:** Failure test where automation is practical.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-36 — Load and capacity validation

Measure the documented workloads and record results before any extra scaling topology.

### F-36-01 — API and search load

Measure Gateway and search before adding search topology.

### T-0276 — Measure Gateway latency on a local authenticated workload

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-01 API and search load
- **Priority:** P1
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/load
- **MVP class:** MVP
- **Dependencies:** T-0220, T-0122
- **Requirements:** NFR-03
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §1; 27 Phase 31 steps 31.1-31.2

Record RPS, p50, p95, p99, CPU, memory, event-loop lag, JWT cost, and error rate for a small local run.

**Deliverable:** Load script and a results note.

**Suggested files:** tests/load/gateway-authenticated-api.js

**Acceptance criteria**

- The script targets the Gateway
- It does not claim the local run equals 100k users
- Results include the named measurements

**Verification:** Run the script and file the note.

**Testing:** The load script.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0277 — Measure movie search latency on a local index

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-01 API and search load
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/load
- **MVP class:** MVP
- **Dependencies:** T-0224, T-0153
- **Requirements:** NFR-06
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §4; 03_CAPACITY_ESTIMATION.md search

Run a local search load and record Meilisearch CPU, memory, latency, and response size.

**Deliverable:** Load script and results note.

**Suggested files:** tests/load/movie-search.js

**Acceptance criteria**

- The paper target of 3.6k average and 7k-11k peak is labeled as the architecture model
- The local result is not used to approve a horizontal cluster
- NFR-06 is compared with the measured p95

**Verification:** Run the script.

**Testing:** The load script.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-36-02 — Realtime, notification, and media load

Measure rooms, chat, notifications, and transcode queue behavior.

### T-0278 — Load 1,000 local room sockets and record fan-out latency

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-02 Realtime, notification, and media load
- **Priority:** P1
- **Estimated effort:** 4 hours
- **Complexity:** L
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/load
- **MVP class:** MVP
- **Dependencies:** T-0221, T-0182, T-0185
- **Requirements:** NFR-02; NFR-04; NFR-05
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 31 steps 31.6-31.11

Open 1,000 sockets locally, send playback and chat, and record propagation latency.

**Deliverable:** Local rooms load script.

**Suggested files:** tests/load/rooms-websocket.js

**Acceptance criteria**

- The run starts at 1,000 sockets, not 40,000
- Playback samples are compared with 200 ms
- Chat samples are compared with 500 ms
- Heartbeats use the accepted 30-second interval, not the capacity model's 0.1/sec, unless the decision changed it

**Verification:** Run the script.

**Testing:** The load script.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0279 — Plan the larger rooms and search runs without buying 100k capacity

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-02 Realtime, notification, and media load
- **Priority:** P2
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/load
- **MVP class:** Post-MVP
- **Dependencies:** T-0278, T-0277, T-0024
- **Requirements:** NFR-01; NFR-15
- **Source:** 03_CAPACITY_ESTIMATION.md; 27 Phase 31 steps 31.7-31.8 and 31.18-31.19

Describe how a later 5,000-socket run and the paper-scale search target would be executed without putting that capacity in the MVP bill.

**Deliverable:** A capacity-results section that separates MVP evidence from the 100k model.

**Suggested files:** docs/runbooks/capacity-results.md

**Acceptance criteria**

- 40,000 sockets and 11k search QPS are not MVP exit criteria
- Horizontal Meilisearch and a search cache stay disallowed until a measured NFR miss
- The $300 budget is restated

**Verification:** Review the section against NFR-01 and NFR-15.

**Testing:** No production load in this ticket.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0280 — Measure transcode queue depth with concurrent fixture jobs

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-02 Realtime, notification, and media load
- **Priority:** P1
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests/load
- **MVP class:** MVP
- **Dependencies:** T-0226, T-0211
- **Requirements:** —
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §10; ADR-013

Enqueue several fixture jobs and record queue depth, duration, and worker behavior.

**Deliverable:** Media load script and a short result note.

**Suggested files:** tests/load/media-upload-transcode.js

**Acceptance criteria**

- Jobs do not all transcode at once if one worker is configured
- Queue depth is visible
- The test uses fixtures, not 20 GB files

**Verification:** Run the script.

**Testing:** The load script.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0281 — Record capacity results and the decision not to add unused topology

- **Epic:** E-36 Load and capacity validation
- **Feature:** F-36-02 Realtime, notification, and media load
- **Priority:** P1
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 5 — Quality and hardening
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0276, T-0277, T-0278, T-0280
- **Requirements:** NFR-01; NFR-03; NFR-04; NFR-05; NFR-06; NFR-07
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 31 steps 31.17-31.19; 21_OBSERVABILITY_AND_METRICS.md

Write the measurements and state whether any NFR missed on the local run.

**Deliverable:** capacity-results.md.

**Suggested files:** docs/runbooks/capacity-results.md

**Acceptance criteria**

- Each local script has a section
- NFR-07 is recorded as not yet given a numeric budget
- No horizontal search or Redis search cache is added by this ticket

**Verification:** Read the document against the script output.

**Testing:** No additional test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-37 — MVP deployment and operations

Deploy a budget-constrained environment that preserves the target architecture's boundaries.

### F-37-01 — Production packaging

Produce deployable images and an environment variable contract.

### T-0282 — Harden production images and the environment variable contract

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-01 Production packaging
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0076, T-0235
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 steps 32.1-32.2

Review every Dockerfile for a non-root user, a healthcheck, and no baked secrets, and list production variables.

**Deliverable:** Image checklist and env documentation.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- Every app image is listed
- Secrets are injected at runtime
- The variable list covers databases, Redis, RabbitMQ, Meilisearch, object storage, JWT, and web origin

**Verification:** Build each image.

**Testing:** Image startup smoke using the health endpoint.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-37-02 — Environment provisioning

Provision MVP dependencies inside the budget target without provisioning 100k capacity.

### T-0283 — Write the MVP cost worksheet before provisioning

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0024, T-0282
- **Requirements:** NFR-15
- **Source:** 20_TESTING_AND_VALIDATION_PLAN.md §12; 24_SCALING_AND_DEPLOYMENT_STRATEGY.md MVP

Estimate monthly cost for the smallest managed Auth database, movie database, MongoDB, Redis, broker, object storage, CDN, and one small compute host.

**Deliverable:** A worksheet that is at or under $300 or that stops provisioning.

**Suggested files:** docs/runbooks/cost.md

**Acceptance criteria**

- Each line has a price source and a date
- 100k-concurrent capacity is not a line item
- If the total exceeds $300, the ticket stops and records the overrun instead of provisioning

**Verification:** Review the arithmetic.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0284 — Provision the MVP Auth database

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision Auth PostgreSQL using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0285 — Provision the MVP Movie database

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision Movie PostgreSQL using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0286 — Provision the MVP Users database

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision MongoDB using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0287 — Provision HA-capable Redis for MVP

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision Redis using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0288 — Provision the MVP message broker

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision RabbitMQ or managed AMQP using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0289 — Provision the private media bucket

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-15
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision object storage using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### T-0290 — Provision the CDN in front of the media bucket

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-02 Environment provisioning
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0283
- **Requirements:** NFR-11
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32; G-14

Provision CDN using the hosting decision and the cost worksheet. Do not name a vendor in code before the worksheet does.

**Deliverable:** A documented resource identifier and connection method.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- The resource exists
- It is not publicly writable
- Its monthly cost is on the worksheet
- Credentials are in the secret manager, not in git

**Verification:** Connect from the operator workstation with the secret manager value.

**Testing:** Connection smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** Provisioning tickets can run in parallel after the cost worksheet.

### F-37-03 — Release smoke and operations

Smoke-test the deployed paths and write deployment, backup, and rollback notes.

### T-0291 — Deploy the API, workers, and WebSocket endpoint

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-03 Release smoke and operations
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** L
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0282, T-0284, T-0285, T-0286, T-0287, T-0288, T-0241
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 steps 32.11-32.16

Run Gateway behind HTTPS, Rooms behind WSS, and the other services on the private network.

**Deliverable:** Deployed processes and secret bindings.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- Gateway HTTPS responds
- Rooms WSS completes a TLS handshake
- Auth, Users, Movie, Notifications, and the worker are not published as public data APIs
- CORS matches the production web origin

**Verification:** Curl the health endpoints through their intended exposure.

**Testing:** Deployment smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0292 — Run production migrations and search index setup

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-03 Release smoke and operations
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** infra
- **MVP class:** MVP
- **Dependencies:** T-0291, T-0081, T-0142, T-0151, T-0193
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 steps 32.17-32.18

Apply Auth, Movie, and Notifications migrations and create the Meilisearch index.

**Deliverable:** A recorded migration run.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- Migrations are forward-only in this ticket
- The index settings match the local setup
- A failure stops the release

**Verification:** Query schema versions and Meilisearch settings.

**Testing:** Migration dry run against a staging database if one exists; otherwise the production run is logged.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0293 — Configure signed CDN media access

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-03 Release smoke and operations
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Proposed
- **Service / module:** movie-service
- **MVP class:** MVP
- **Dependencies:** T-0290, T-0289, T-0212
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 step 32.14; 22_SECURITY_MODEL.md

Point production media access at the CDN signer while local development keeps MinIO.

**Deliverable:** Environment-specific signer.

**Suggested files:** apps/movie-service/src/playback

**Acceptance criteria**

- Production URLs are CDN URLs
- The origin bucket is not anonymously readable
- Local tests still pass with MinIO

**Verification:** Request media-access in the deployed environment and fetch one playlist through the CDN.

**Testing:** Deployed smoke plus the existing local test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0294 — Smoke-test the deployed Gateway, Rooms socket, and signed playback

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-03 Release smoke and operations
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 6 — Deployment
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** tests
- **MVP class:** MVP
- **Dependencies:** T-0292, T-0293, T-0244
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 steps 32.19-32.21

Run a minimal deployed check for login, a room handshake, and a signed playlist request.

**Deliverable:** Smoke log.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- Gateway login works
- WSS handshake works
- Signed playback URL returns the playlist
- No service returns media bytes itself

**Verification:** Execute the smoke commands.

**Testing:** Deployed smoke.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0295 — Write deployment, backup, and rollback notes

- **Epic:** E-37 MVP deployment and operations
- **Feature:** F-37-03 Release smoke and operations
- **Priority:** P0
- **Estimated effort:** 3 hours
- **Complexity:** M
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Inferred
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0294
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 32 step 32.22; G-13

Document how to deploy, how to roll back a stateless service, and what is backed up. Multi-region disaster recovery stays deferred.

**Deliverable:** Operations section.

**Suggested files:** docs/runbooks/deployment.md

**Acceptance criteria**

- Stateless services can be rolled back to the previous image
- Database migrations are described as forward-only unless a specific down step exists
- Auth PostgreSQL, Movie PostgreSQL, Users MongoDB, and the media bucket have a backup owner and frequency, or the gap is explicitly left open
- The procedure does not add a second region

**Verification:** A second engineer can explain the rollback from the document.

**Testing:** No runtime test.

**Implementation notes:** Backup frequency is not in the source pack. The ticket requires the operator to choose it or to record that it is still unknown. G-13.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

## E-38 — Documentation refresh and release acceptance

Align the design pack with what shipped and complete the MVP acceptance checklist.

### F-38-01 — Documentation alignment

Update the design pack only where implementation evidence changed it.

### T-0296 — Point the documentation index at the implementation plan

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0263
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 00_README.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 00_README.md.

**Suggested files:** 00_README.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0297 — Point the short implementation plan at the expanded plan

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0296
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 19_IMPLEMENTATION_PLAN.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 19_IMPLEMENTATION_PLAN.md.

**Suggested files:** 19_IMPLEMENTATION_PLAN.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0298 — Mark accepted decisions in the open-questions list

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0025, T-0294
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md.

**Suggested files:** 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0299 — Update the data-model draft where field names changed

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0139, T-0215
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 23_DATA_MODELS_DRAFT.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 23_DATA_MODELS_DRAFT.md.

**Suggested files:** 23_DATA_MODELS_DRAFT.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0300 — Update ADRs only where implementation evidence changed them

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0012, T-0013
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 16_ARCHITECTURE_DECISIONS.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 16_ARCHITECTURE_DECISIONS.md.

**Suggested files:** 16_ARCHITECTURE_DECISIONS.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0301 — Record the accepted implementation choices in the decision log

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0298
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 17_DECISION_LOG.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 17_DECISION_LOG.md.

**Suggested files:** 17_DECISION_LOG.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0302 — Add the real test commands to the testing plan

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0263, T-0281
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 20_TESTING_AND_VALIDATION_PLAN.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 20_TESTING_AND_VALIDATION_PLAN.md.

**Suggested files:** 20_TESTING_AND_VALIDATION_PLAN.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0303 — Name the final dashboards in the observability document

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0231
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 21_OBSERVABILITY_AND_METRICS.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 21_OBSERVABILITY_AND_METRICS.md.

**Suggested files:** 21_OBSERVABILITY_AND_METRICS.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0304 — Record the final token and upload rules in the security model

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-01 Documentation alignment
- **Priority:** P2
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** docs
- **MVP class:** MVP
- **Dependencies:** T-0239
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 33

Update 22_SECURITY_MODEL.md so a reader can find the implementation result without contradicting the code.

**Deliverable:** Updated 22_SECURITY_MODEL.md.

**Suggested files:** 22_SECURITY_MODEL.md

**Acceptance criteria**

- The file mentions the implementation outcome
- Deferred items that were not accepted stay deferred
- No new product scope is added during the edit

**Verification:** Read the diff against the decision log.

**Testing:** No runtime test.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### F-38-02 — MVP acceptance

Run the final checklist and tag the MVP only after it passes.

### T-0305 — Run the automated acceptance commands

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-02 MVP acceptance
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0242, T-0263, T-0281
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 34 steps 34.1-34.9

Run infrastructure, services, format, lint, typecheck, unit, integration, end-to-end, and the selected load smoke.

**Deliverable:** An acceptance log with command output.

**Suggested files:** docs/runbooks/acceptance.md

**Acceptance criteria**

- Each command's pass or fail is recorded
- A failure stops the release tag

**Verification:** Re-run any failed command after a fix.

**Testing:** The existing suites.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0306 — Walk the product acceptance checklist

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-02 MVP acceptance
- **Priority:** P0
- **Estimated effort:** 4 hours
- **Complexity:** M
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** web
- **MVP class:** MVP
- **Dependencies:** T-0305, T-0262, T-0261, T-0219, T-0237
- **Requirements:** FR-01; FR-02; FR-03; FR-04; FR-05; FR-06; FR-07; FR-08; FR-10; FR-11; FR-12; FR-13; FR-14; FR-15; FR-16; FR-17; FR-18; FR-19; FR-20; FR-21; FR-22; FR-23; FR-24; FR-25; FR-26; FR-27; FR-28; FR-29; FR-30; FR-31; FR-32; FR-33; FR-34; FR-35; FR-36; FR-37
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 34 steps 34.10-34.33

Check every user-visible behavior in the final checklist, including close room, duplicate chat id, and signed playback.

**Deliverable:** Completed checklist.

**Suggested files:** docs/runbooks/acceptance.md

**Acceptance criteria**

- Each Phase 34 product step is marked pass or fail with evidence
- FR-09 is marked deferred rather than passed
- Application services do not serve media bytes

**Verification:** Review the checklist.

**Testing:** Manual confirmation backed by the automated journeys.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0307 — Check metrics, dashboards, request ids, secrets, and CI

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-02 MVP acceptance
- **Priority:** P0
- **Estimated effort:** 2 hours
- **Complexity:** S
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0306, T-0231, T-0238, T-0295
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 34 steps 34.34-34.38

Confirm operational acceptance items.

**Deliverable:** Checklist section.

**Suggested files:** docs/runbooks/acceptance.md

**Acceptance criteria**

- Metrics endpoints respond
- The three dashboards load
- A sample log has a request id
- git grep finds no committed private key
- CI is green

**Verification:** Perform each check.

**Testing:** CI status plus manual checks.

**Implementation notes:** None beyond the cited sources.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.

### T-0308 — Tag the MVP release after acceptance passes

- **Epic:** E-38 Documentation refresh and release acceptance
- **Feature:** F-38-02 MVP acceptance
- **Priority:** P0
- **Estimated effort:** 1 hour
- **Complexity:** XS
- **Execution phase:** Stage 7 — Production readiness
- **Status:** Missing
- **Confidence:** Confirmed
- **Service / module:** repo
- **MVP class:** MVP
- **Dependencies:** T-0307, T-0304, T-0302
- **Requirements:** —
- **Source:** 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Phase 34 step 34.39

Create the v0.1.0-mvp tag only after the acceptance log is clean.

**Deliverable:** Git tag instructions and the tag once the operator runs them.

**Suggested files:** docs/runbooks/acceptance.md

**Acceptance criteria**

- The tag is not created when any acceptance item failed
- The tag name is v0.1.0-mvp
- Pushing the tag is an operator action, not an automatic side effect of writing docs

**Verification:** git show v0.1.0-mvp

**Testing:** No new test.

**Implementation notes:** This backlog does not create the tag. The future implementer does, after the checklist passes.

**Parallelization:** After its dependencies, this can run beside tickets that do not share the same files.
