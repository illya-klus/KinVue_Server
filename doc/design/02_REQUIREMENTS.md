# KinVue — Requirements v1

## Functional Requirements

### Authentication and profile

- **FR-01** User can register.
- **FR-02** User can log in.
- **FR-03** User can log out.
- **FR-04** User can open and view their profile.

### Social

- **FR-05** User can find other users.
- **FR-06** User can send friend requests.
- **FR-07** User can accept/reject friendship requests.
- **FR-08** User can view friends.
- **FR-09** User can view selected social/movie activity where the product allows it.

### Movies

- **FR-10** User can search movies.
- **FR-11** User can save movies for later/watchlist.
- **FR-12** Admin can create a new movie.
- **FR-13** Admin can upload media for a movie.
- **FR-14** Admin can publish a movie immediately.
- **FR-15** Admin can schedule a movie release.

### Playback

- **FR-16** User can start playback.
- **FR-17** User can pause playback.
- **FR-18** User can resume playback.
- **FR-19** User can seek backward.
- **FR-20** User can seek forward.
- **FR-21** User can stop/exit playback.

### Rooms

- **FR-22** User can create an empty private room.
- **FR-23** User can create an empty public room.
- **FR-24** User can join a public room.
- **FR-25** Invited users can join a private room.
- **FR-26** Room owner can close the room.
- **FR-27** User can invite another user inside the application.
- **FR-28** User can invite another user via URL.
- **FR-29** Room owner can grant another participant playback-control permissions.
- **FR-30** Invited user can be read-only/view-only by default.
- **FR-31** Authorized room participants can play/pause/seek according to room permissions.

### Realtime communication

- **FR-32** Room participants can send chat messages.
- **FR-33** Room participants can send reactions.
- **FR-34** Room participants receive realtime playback changes.
- **FR-35** Reconnecting participants can resynchronize to the current room state.

### Scheduling

- **FR-36** Users can schedule future watch rooms.
- **FR-37** A scheduled room can be associated with a movie and invitees.

## Non-Functional Requirements

### Scale

- **NFR-01** Target architecture should support up to **100,000 concurrent connected users**.
- **NFR-02** A room should support up to **20 participants** while still satisfying the realtime latency target.

### Latency

- **NFR-03** Normal API operations should target low hundreds of milliseconds where appropriate.
- **NFR-04** Room event propagation target: **< 200 ms**.
- **NFR-05** Chat delivery target: **< 500 ms**.
- **NFR-06** Movie search target: **< 1–2 seconds**.
- **NFR-07** Playback synchronization drift should be kept small enough to preserve the watch-together experience. Exact target should be validated experimentally.

### Consistency

- **NFR-08** Movie search/index data may be eventually consistent after movie create/update/publish.
- **NFR-09** Room playback controls do not require strict serializable consistency.
- **NFR-10** Concurrent play/pause/seek races are acceptable; last processed state may win.

### Durability

- **NFR-11** Successfully uploaded media assets must not be accidentally lost.
- **NFR-12** Important notification events should use at-least-once processing semantics.
- **NFR-13** Room chat is currently treated as ephemeral and may expire by TTL.
- **NFR-14** If stronger chat durability is required later, a durable message store must be introduced.

### Cost

- **NFR-15** Demo/MVP infrastructure budget target: **<= $300/month**.

## Requirement clarifications

### `100k concurrent` is an architecture target

It does not mean the MVP must pay for 100k concurrent capacity from day one.

### Search consistency

PostgreSQL is the movie source of truth.

Meilisearch is a derived index and can lag behind.

### Media access

Media assets should not be publicly readable without authorization.

The current design uses signed access to CDN/object storage.

### Registration guarantee

Registration is considered successful only after both:

- Auth identity exists and is active.
- Users profile exists.

The client should not receive successful registration before the workflow reaches that state.
