# KinVue — Service Boundaries

## Auth Service

Owns:

- login identity;
- password/credential data;
- token issuance;
- refresh/revocation;
- registration state;
- account activation status.

Does not own:

- display name;
- avatar;
- social graph;
- watch history;
- movie metadata.

---

## Users Service

Owns:

- profile;
- display name;
- avatar;
- preferences;
- friendships;
- friend requests;
- social/user-related projections where justified.

Does not own:

- credentials;
- access tokens;
- movie source-of-truth data;
- room realtime state.

---

## Rooms Service

Owns:

- room lifecycle;
- room visibility/private/public state;
- participants/presence;
- room permissions;
- selected `movieId`;
- playback state;
- realtime synchronization;
- chat;
- reactions.

Does not own:

- actual movie bytes;
- movie metadata source of truth;
- user profile source of truth.

Core rule:

- Rooms answers **WHEN / HOW the room is watching**.
- Movie answers **WHAT movie exists and where its media is**.
- CDN/S3 provide **the bytes**.
- Client player performs **actual playback**.

---

## Movie Service

Owns:

- movie metadata;
- status/lifecycle;
- genres;
- duration;
- poster references;
- catalog data;
- media keys/identifiers;
- publish/schedule state;
- source-of-truth movie record.

Integrates with:

- Meilisearch as search projection;
- S3/CDN through signed media access concepts;
- transcoding pipeline indirectly.

Does not proxy video bytes.

---

## Notifications Service

Owns:

- consuming notification-worthy events;
- retry/failure handling at consumer side;
- push/in-app delivery logic;
- notification deduplication strategy where needed.

Does not own:

- room state;
- friendship business state;
- the business action that caused the event.

The producer of the business event is the owning domain:

- Rooms -> `ROOM_INVITED`
- Users -> `FRIEND_REQUEST_*`

Gateway does not publish business events just because it saw an HTTP request.

---

## Chat

Current decision:

- no separate Chat Service;
- chat is part of Rooms;
- same WebSocket;
- same Redis HA;
- messages may use TTL.

Extract a separate service only if chat becomes a first-class domain with:

- global DMs;
- long-term durable history;
- independent moderation;
- independent scaling;
- attachments/search;
- large unread/read-state subsystem.

---

## Streaming Service

Current decision:

- no separate Streaming Service in v1.

Responsibilities stay split between:

- Movie Service for control/metadata/access;
- transcoding pipeline for preparation;
- S3/CDN for delivery;
- client player for playback.

A dedicated media/streaming service can be extracted later if the domain grows into:

- DRM;
- complex HLS/DASH manifests;
- entitlement systems;
- large transcoding orchestration;
- quality/profile management;
- separate independent scaling/business lifecycle.
