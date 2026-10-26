# KinVue — Product Overview

## Product concept

KinVue is a social watch-together platform focused on synchronized movie watching.

The core value is not simply a movie catalog. The important part is:

- choosing a movie;
- watching it solo or with other people;
- keeping playback synchronized;
- interacting with participants;
- preserving a social layer around movies.

## Primary user flows

A typical user should be able to:

1. Register and log in.
2. Search for a movie.
3. Open a movie.
4. Choose:
   - solo watch;
   - private room;
   - public room.
5. Watch the movie.
6. Create or join a room.
7. Invite friends.
8. Synchronize play/pause/seek.
9. Chat and react.
10. Save movies for later.
11. Schedule future watch sessions.

Admins should be able to:

1. Create movie metadata.
2. Upload the original media file.
3. Process/transcode the movie.
4. Publish immediately or schedule a release.

## Important product characteristics

### Rooms are ephemeral

Rooms are closer to a call/session than to a permanent database entity.

The current design assumes:

- room state is temporary;
- current playback state must be fast;
- users may reconnect;
- losing one transient playback event is acceptable;
- a room can expire after inactivity.

### Movie catalog is read-heavy

The movie catalog:

- has relatively rare writes;
- has frequent reads/searches;
- can tolerate eventual consistency between the movie source of truth and search index.

### Chat is secondary

Room chat is not the primary product.

Current v1 direction:

- chat belongs to the Rooms domain;
- chat is ephemeral;
- chat can use Redis with TTL;
- a separate Chat Service is not required initially.

If future requirements add long-term history, moderation, global DMs, large attachments, or independent lifecycle/scaling, chat can be extracted later.

## Target scale

Architecture target:

- 100,000 concurrent users.
- 40,000 users currently in rooms.
- 8,000 concurrent rooms.
- 46,000 concurrent video streams in the baseline capacity model.

The MVP/demo deployment does not need to serve that traffic physically.
