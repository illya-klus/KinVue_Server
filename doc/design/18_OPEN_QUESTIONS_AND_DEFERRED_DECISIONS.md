# KinVue — Open Questions and Deferred Decisions

## Accepted Sprint 1 policies

Auth TTL, RS256/JWKS verification and refresh rotation/revocation are fixed by [0020](../decisions/0020-auth-password-rs256-and-sessions.md). Password hashing, compensation and admin bootstrap are fixed by [0021](../decisions/0021-auth-policy-gates.md). Room/chat TTL, presence, roles and heartbeat are fixed by [0022](../decisions/0022-room-policy-gates.md). Durable invites and schedules use Rooms PostgreSQL per [0023](../decisions/0023-rooms-durable-storage.md). Username rules are fixed by [0024](../decisions/0024-registration-username-policy.md), browser storage and invite URLs by [0025](../decisions/0025-browser-session-storage.md). These are decisions; implementation is tracked separately.

## Rooms

- Subscribe each Rooms instance to every room channel or only rooms with locally connected users?
- Exact Redis HA topology?
- Do we need room-state version numbers in v1?

## Chat

- When/if durable storage is introduced?
- Message-size limits?
- Moderation requirements?

## Auth

- Full signing-key rotation ceremony and JWKS refresh/distribution timing?
- Password reset/email verification?

## Users

- User search implementation?
- Friendship pagination?
- Mutual friends?
- Watch-history ownership/location?
- Recommendation projections?

## Movies/Search

- Exact movie schema?
- Exact search ranking?
- Debounce duration?
- Minimum query length?
- Cron interval: daily vs 5/15 minutes?
- Full rebuild vs incremental sync default?
- Exact scheduled-publish worker implementation?

## Media

- HLS-only or HLS + DASH?
- Exact bitrate ladder?
- Exact video/audio codecs?
- Cleanup thresholds for abandoned upload?
- Worker retry count?
- Transcoding provider: FFmpeg containers vs managed service?
- Originals retention policy?
- DRM future?
- Signed URL vs signed cookie at CDN?

## Notifications

- Push provider?
- Device-token ownership/storage?
- Notification inbox or push-only?
- Dedup store?
- Event TTL?
- DLQ replay tooling?
- Provider idempotency support?

## Infrastructure

- Cloud provider?
- Container platform?
- Deployment topology?
- Secrets management?
- TLS termination?
- Autoscaling thresholds?
- Observability stack?
- CI/CD implementation?

## Reliability

Full failure analysis is intentionally deferred to per-service detailed design.

Do not solve these with infrastructure before the implementation proves the need.
