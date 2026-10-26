# MVP scope

The implementation plan's definition of done is the MVP. A person can register, log in, edit a profile, find someone, become friends, search a published movie, save it, watch solo, create private and public rooms, invite, synchronize playback, chat, react, receive an in-app notification, and play an uploaded and transcoded movie through signed access. CI, local journeys, core failure tests, and per-service metrics are part of that done state.

MVP tickets: 307, about 772 hours.
Post-MVP tickets: 1, about 3 hours.

## In the MVP

- The service boundaries and three ingress paths.
- Local Compose and the shared libraries.
- Auth saga, sessions, and local JWT checks.
- Profiles, user search, and friendships.
- Movie drafts, publish, schedule, search, and watchlist.
- Rooms through chat and reactions, with last-processed-wins playback.
- In-app notifications and a logged fake push provider.
- Direct upload, HLS ladder, and signed playback.
- Scheduled watches, because FR-36 and FR-37 are in the requirements and the final checklist.
- Security regression for private rooms, viewers, admin, and media.
- GitHub Actions for unit, integration, and browser smoke.
- A deployed environment only if the cost worksheet stays within $300 per month.

## Out of the MVP

- Provisioning or passing a test at 100,000 concurrent users, 40,000 sockets, or 7k-11k search QPS. The ticket that plans that evidence is post-MVP.
- Horizontal Meilisearch, a Redis search-result cache, Kafka, DRM, multi-CDN, a Chat Service, a Streaming Service, durable chat, global direct messages, recommendations, a graph database, and two-phase commit.
- Password reset and email verification. They are named as later security work and are not functional requirements.
- FR-09 activity. The sentence does not specify a feed.
- Watch-history projection. It is an example, not a requirement.
- Multi-region disaster recovery.
- Real device push until a provider is chosen. The MVP uses in-app rows and a fake provider.

## Demo slice inside the MVP

If a stakeholder wants a checkpoint before rooms exist, the first demonstrable slice is:

1. Decision tickets for stack, tokens, and movie status.
2. Foundation through Gateway.
3. Registration, login, and profile.
4. Admin draft, publish, search, and watchlist.
5. Upload, transcode, and solo signed playback.

That slice is not the MVP. Room synchronization is the product's stated value, so the MVP is not done at solo playback.
