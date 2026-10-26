# Gaps and unknowns

These items are missing, contradictory, or only proposed. Tickets that depend on them say so. Proposals are not requirements.

## Gaps

### G-01 — FR-09 activity scope is undefined

- **Class:** Missing business requirements
- **What is missing:** FR-09 says a user can view selected social or movie activity where the product allows it. No activity types, privacy rules, or API are specified.
- **Why it matters:** An engineer cannot implement an activity feed without inventing the product.
- **Decision required:** List the exact activities that are visible, to whom, and whether they are required for MVP.
- **What it blocks:** No activity-feed implementation ticket exists. Only the decision ticket that records the deferral.
- **Proposal, not a requirement:** Keep FR-09 out of MVP until a product owner names the activities. Do not build a feed from the one example sentence.
- **Recorded:** Implementation is forbidden until the product answers. [0014](../../decisions/0014-defer-fr09-activity.md). The product still has not named the activities.

### G-02 — Admin authority has no provisioning path

- **Class:** Missing security requirements
- **What is missing:** Admin movie and upload routes require an admin scope. Nothing specifies who grants that scope or how the first admin is created.
- **Why it matters:** FR-12 through FR-15 cannot be executed by a real user until an admin identity exists.
- **Decision required:** Choose a bootstrap mechanism: seeded admin, operator CLI, or a claim issued by Auth.
- **What it blocks:** Admin seed ticket and any end-to-end admin journey.
- **Proposal, not a requirement:** Auth stores a scopes column and a documented local seed command creates one admin. This remains a proposal, not a requirement.

### G-03 — Invite URL contents are unspecified

- **Class:** Missing API contracts
- **What is missing:** FR-28 requires an invite URL. The plan only says the UI copies a URL. It does not say whether the URL is a secret token, a room id, or a signed expiring link.
- **Why it matters:** A room id in a public URL would weaken private rooms.
- **Decision required:** Define the URL format, expiry, and whether opening it adds the user to the invite list.
- **What it blocks:** URL join API and the private-room URL end-to-end test.
- **Proposal, not a requirement:** Use an unguessable invite token stored beside the room membership, expiring with the room. In-app invites can keep using user ids.

### G-04 — Rooms durable outbox has no database

- **Class:** Missing architecture decisions
- **What is missing:** ADR-019 requires a transactional outbox for durable invites. ADR-005 says Rooms v1 has no PostgreSQL. Redis cannot host the documented SQL-style outbox transaction.
- **Why it matters:** ROOM_INVITED can be lost if it is published only after a Redis write, which violates the durability rule for important events.
- **Decision required:** Choose where the Rooms outbox rows live.
- **What it blocks:** Rooms outbox writer, publisher, and invite notification delivery.
- **Proposal, not a requirement:** Add a small Rooms-owned PostgreSQL outbox used only for durable invite and schedule events. Ephemeral playback state stays in Redis. This is an extension of ADR-005 and must be accepted explicitly.

### G-05 — Scheduled-room invitees are missing from the table

- **Class:** Missing data models
- **What is missing:** FR-37 requires invitees. The implementation plan's scheduled_rooms table has owner, movie, visibility, and time, but no invitee rows.
- **Why it matters:** The opener cannot emit invite notifications without somewhere to read invitees.
- **Decision required:** Add a child table or array of invitee user ids and define who may be invited.
- **What it blocks:** Schedule create API, opener, and schedule UI invite picker.
- **Proposal, not a requirement:** Add scheduled_room_invitees(scheduled_room_id, user_id) in the same database as scheduled_rooms.

### G-06 — Movie editorial status and media status share one column

- **Class:** Missing architecture decisions
- **What is missing:** The catalog draft lists DRAFT, SCHEDULED, and PUBLISHED, while the media pipeline lists UPLOADING, PROCESSING, READY, and failure states. The plan puts all of them in one status column.
- **Why it matters:** A movie cannot be both scheduled and processing if those values overwrite each other.
- **Decision required:** Use one combined state machine or two fields: publication_status and media_status.
- **What it blocks:** Movie status constraint, publish rules, upload transitions, and playback authorization.
- **Proposal, not a requirement:** Use two fields. Publication status controls search visibility. Media status controls whether playback can be authorized.

### G-07 — Search is both a protected API and a public route

- **Class:** Contradictory documentation
- **What is missing:** The security model says the API is protected by JWT. The implementation plan lists movie search and movie detail as public routes.
- **Why it matters:** Gateway route tests and the web client need one answer.
- **Decision required:** Decide whether anonymous clients may search and open published movies.
- **What it blocks:** Public Gateway routes and the movie search page's auth behavior.
- **Proposal, not a requirement:** Allow anonymous read of published movies and search. Keep watchlist, rooms, and media-access authenticated.
- **Recorded:** Accepted. [0011](../../decisions/0011-anonymous-published-movie-reads.md).

### G-08 — Refresh token storage in the browser is an unresolved alternative

- **Class:** Missing technical specifications
- **What is missing:** The plan allows either an HTTP-only cookie or an in-memory JSON refresh token and does not pick one.
- **Why it matters:** The web session client and Auth refresh endpoint change shape depending on the choice.
- **Decision required:** Pick cookie or JSON body for v1.
- **What it blocks:** Web refresh storage and the refresh request contract.
- **Proposal, not a requirement:** Use a JSON refresh token held in memory for local development, and an HTTP-only Secure cookie in any deployed environment.

### G-09 — Registration compensation deletes or retains the identity

- **Class:** Contradictory documentation
- **What is missing:** The Auth design says to compensate, cancel, or delete the PENDING identity. The plan sets status COMPENSATED and returns 503 without saying the row is deleted.
- **Why it matters:** A retained email blocks a later registration through the unique constraint.
- **Decision required:** Delete the compensated identity or release the email.
- **What it blocks:** Registration compensation implementation.
- **Proposal, not a requirement:** Keep an audit row but clear or suffix the email so the person can register again. Login stays rejected because status is not ACTIVE.

### G-10 — Heartbeat interval disagrees between capacity and implementation

- **Class:** Contradictory documentation
- **What is missing:** Capacity estimation assumes 0.1 heartbeats per user per second. The plan sends a heartbeat every 30 seconds and marks stale at 75 seconds.
- **Why it matters:** Load tests and presence timeouts cannot use both numbers.
- **Decision required:** Accept the 30-second product heartbeat and treat the 0.1/sec figure as a capacity upper bound only.
- **What it blocks:** Presence sweeper and the rooms load model notes.
- **Proposal, not a requirement:** Implement 30 seconds / 75 seconds. Record in the capacity results that the 4k/sec heartbeat figure is not the v1 client behavior.

### G-11 — Argon2id parameters are unnamed

- **Class:** Missing technical specifications
- **What is missing:** The security model defers password hashing parameters. The plan selects Argon2id only.
- **Why it matters:** Weak parameters undermine credential storage.
- **Decision required:** Choose memory, time, and parallelism, and record them.
- **What it blocks:** Password hasher ticket.
- **Proposal, not a requirement:** Select current OWASP Argon2id parameters at implementation time and store them in the decision log. Do not treat a specific number as already required.

### G-12 — Admin edit needs a read that is not specified

- **Class:** Missing API contracts
- **What is missing:** The admin edit page must load a draft movie. The plan specifies public GET for published movies only, not an admin read.
- **Why it matters:** The edit screen cannot be built from the public endpoint.
- **Decision required:** Add GET /admin/movies/:movieId for admin scope.
- **What it blocks:** Admin edit API and admin edit page.
- **Proposal, not a requirement:** Add that admin read. It is inferred from the edit page, not from an explicit endpoint list.

### G-13 — Backup and rollback are not specified

- **Class:** Missing operational requirements
- **What is missing:** Deployment steps exist. Backup frequency, restore drills, and rollback steps do not.
- **Why it matters:** MVP acceptance can deploy a system that cannot be restored.
- **Decision required:** Define backup scope for Auth PostgreSQL, Movie PostgreSQL, Users MongoDB, and object storage. Define rollback for stateless services versus forward-only migrations.
- **What it blocks:** Operational runbook tickets.
- **Proposal, not a requirement:** Write the procedures without adding multi-region disaster recovery, which the decision log explicitly defers.

### G-14 — Cloud vendor, Redis topology, CDN, and push provider are deferred

- **Class:** Missing infrastructure decisions
- **What is missing:** The decision log defers cloud provider, Redis Sentinel versus Cluster, CDN vendor, and push provider.
- **Why it matters:** Production tickets cannot honestly name a vendor.
- **Decision required:** Choose a host that can stay near the $300/month target, a Redis HA option, a CDN, and whether v1 push is fake-only.
- **What it blocks:** Provisioning tickets.
- **Proposal, not a requirement:** Keep vendor names out of implementation tickets. Provision managed equivalents of the local services and use in-app notifications plus a logged fake push provider.

### G-15 — Internal service authentication is deferred

- **Class:** Missing security requirements
- **What is missing:** Mutual TLS is explicitly deferred. Services are still told not to be publicly exposed.
- **Why it matters:** Internal profile creation and transcode callbacks are unsafe if published on the Gateway.
- **Decision required:** Confirm network policy as the v1 control and leave mutual TLS out.
- **What it blocks:** Internal route exposure tests.
- **Proposal, not a requirement:** Do not mount /internal routes on the Gateway. Place them on a private Docker network and require a shared internal token only if the network boundary cannot be guaranteed. The token is a proposal.

### G-16 — Password reset and email verification are deferred

- **Class:** Missing business requirements
- **What is missing:** The security backlog lists them as later design. They are not functional requirements.
- **Why it matters:** Building them would invent scope.
- **Decision required:** Confirm they stay out of MVP.
- **What it blocks:** Nothing. No implementation tickets were created.
- **Proposal, not a requirement:** Leave them out. A locked-out user has no recovery flow in v1, and that limitation should be written in the security runbook.

### G-17 — Exact playback drift target is experimental

- **Class:** Missing technical specifications
- **What is missing:** NFR-07 says drift must be small enough for watch-together and must be validated experimentally. No millisecond target exists.
- **Why it matters:** A test cannot fail a numeric drift budget that was never set.
- **Decision required:** Set a target only after the first two-client measurement.
- **What it blocks:** No numeric drift assertion ticket. The sync tests assert state convergence and the 200 ms propagation NFR.
- **Proposal, not a requirement:** Measure first. Do not invent a drift budget in the backlog.

### G-18 — Imported Jira descriptions do not match the backlog keys

- **Class:** Unclear implementation status
- **What is missing:** All 148 `scripts/issue-desc` files were read on the second pass. Keys do not match `28_JIRA_BACKLOG.md`. `KIN-126.md` describes movie search, while document 28 assigns KIN-126 to the registration saga. `KIN-11.md` through `KIN-37.md` are epic blurbs stored under story filenames. `KIN-52.md` through `KIN-81.md` repeat again from `KIN-82.md` onward. The set stops at `KIN-158.md` (`room.state_sync`) and never contains the later story bodies for playback, chat, upload, transcode, or deployment.
- **Why it matters:** Those files cannot be used as requirements or as proof that work exists.
- **Decision required:** Treat 00 through 27 as the source. Do not import the mismatched description files.
- **What it blocks:** No product ticket.
- **Proposal, not a requirement:** Use this engineering backlog's T-ids rather than assuming the KIN keys are consistent.

### G-19 — Watch-history projection is an example, not a requirement

- **Class:** Missing data models
- **What is missing:** The users document shows an optional user_watch_history projection. No FR requires watch history.
- **Why it matters:** Implementing it would add a new product surface.
- **Decision required:** Confirm watch history stays deferred.
- **What it blocks:** No watch-history tickets were created.
- **Proposal, not a requirement:** Keep the example in the data-model notes and do not build it in v1.

### G-20 — No automated test code exists

- **Class:** Missing testing requirements
- **What is missing:** The testing plan names scenarios. The repository has no test suite.
- **Why it matters:** Status must stay Missing rather than Partial.
- **Decision required:** None beyond executing the testing tickets.
- **What it blocks:** All test tickets, which are already in the backlog.
- **Proposal, not a requirement:** Add tests with the feature they verify, not as a later bulk rewrite.

## Contradictions

### C-01 — Decision log still defers choices the implementation plan marks fixed

- **Documents:** 17_DECISION_LOG.md Deferred; 18_OPEN_QUESTIONS_AND_DEFERRED_DECISIONS.md; 27_MAIN_STEP_BY_STEP_IMPLEMENTATION_PLAN.md Implementation Decisions Fixed
- **Impact:** Token TTL, username rules, TTLs, codecs, and the notification provider are proposals until E-00 accepts them.

### C-02 — One movie status column mixes two lifecycles

- **Documents:** 09_MOVIE_SEARCH_AND_INDEXING.md; 10_MEDIA_UPLOAD_TRANSCODING_DELIVERY.md; 23_DATA_MODELS_DRAFT.md; 27 Phase 7
- **Impact:** Tracked as G-06. Schema work waits on that decision.

### C-03 — Heartbeat rate disagrees

- **Documents:** 03_CAPACITY_ESTIMATION.md §2; 27 Phase 17
- **Impact:** Tracked as G-10.

### C-04 — Compensation delete versus retained COMPENSATED row

- **Documents:** 06_AUTH_AND_REGISTRATION.md; 27 Phase 8 steps 8.14-8.15
- **Impact:** Tracked as G-09.

### C-05 — Anonymous movie read versus JWT-protected API

- **Documents:** 22_SECURITY_MODEL.md API; 27 Phase 10 step 10.2
- **Impact:** Tracked as G-07.

### C-06 — Rooms outbox versus no Rooms database

- **Documents:** ADR-005; ADR-019; 11_NOTIFICATIONS_MESSAGING_RELIABILITY.md; 27 Phase 16 step 16.15
- **Impact:** Tracked as G-04.

### C-07 — Scheduled rooms stored in Movie PostgreSQL

- **Documents:** ADR-005; 05_SERVICE_BOUNDARIES.md; 27 Phase 25 step 25.2
- **Impact:** The plan states the exception. E-00 still has to accept it because it moves durable room scheduling into the movie database.

### C-08 — Watchlist ownership is only in the implementation plan

- **Documents:** 07_USERS_AND_SOCIAL_GRAPH.md example projection; 27 Phase 14 and the fixed decisions
- **Impact:** FR-11 confirms the capability. Which service owns the rows is a proposal: Movie PostgreSQL.

### C-09 — 100k concurrent target and $300 MVP budget are different constraints

- **Documents:** 00_README.md; 02_REQUIREMENTS.md NFR-01 and NFR-15; 24_SCALING_AND_DEPLOYMENT_STRATEGY.md
- **Impact:** This is intentional. Load-test tickets for the paper scale are post-MVP. MVP provisioning tickets must not buy 100k capacity.

### C-10 — Issue description files disagree with the Jira backlog

- **Documents:** 28_JIRA_BACKLOG.md; every file in scripts/issue-desc/
- **Impact:** Tracked as G-18. Those files were read in full on the second pass. They are not a product source, and they did not change the ticket set.

## Implementation status

No ticket is Partial or Implemented. The design documents exist. The application they describe does not. The mismatched `scripts/issue-desc` files are not evidence that a feature was built.
