# KinVue — Open Questions and Deferred Decisions

## Rooms

- Subscribe each Rooms instance to every room channel or only rooms with locally connected users?
- Exact Redis HA topology?
- Do we need room-state version numbers in v1?
- Exact stale-connection/heartbeat strategy?
- Room TTL values?
- Presence semantics?
- Room permission model details?

## Chat

- Exact TTL?
- Should recent chat survive room closure?
- When/if durable storage is introduced?
- Message-size limits?
- Moderation requirements?

## Auth

- Access-token TTL?
- Refresh-token rotation policy?
- Key rotation/JWKS distribution?
- Password reset/email verification?
- Exact session revocation strategy?

## Users

- User search implementation?
- Username uniqueness rules?
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
