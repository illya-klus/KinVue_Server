# KinVue — Security Model v1

## External entry points

KinVue intentionally has multiple public ingress paths:

- API/Gateway;
- Rooms WebSocket;
- CDN/media.

Each is protected differently.

---

## API

Protected by:

- TLS;
- JWT validation at Gateway for authenticated routes;
- rate limiting;
- authorization;
- validation.

Anonymous clients may call movie search and published movie detail. Watchlist, media access, and admin routes require JWT. See decision 0011.

---

## Rooms WebSocket

Protected by:

- TLS (`wss`);
- JWT during handshake;
- room access check;
- room permission check.

A direct Rooms endpoint is public but not unauthenticated.

---

## Auth tokens

### Access token

- lifetime 15 minutes, RS256 with issuer, audience, expiry and scope checks;
- validated locally;
- not checked against Auth DB on every request.

### Refresh token

- lifetime 30 days;
- processed by Auth;
- only its hash is stored by Auth; each refresh atomically consumes the old session and creates a replacement; logout revokes it;
- browser storage: HttpOnly cookie locally and after deployment, Secure in production; access-token stays in memory. See [0020](../decisions/0020-auth-password-rs256-and-sessions.md) and [0025](../decisions/0025-browser-session-storage.md).

---

## Media

S3/object storage should not be publicly readable by default.

Viewer flow:

- API authorization;
- signed CDN/media access;
- short-lived signed URL/token/cookie.

Important:

Signed URLs control access but do not magically prevent piracy/recording.

DRM is a separate future concern.

---

## Upload

Admin obtains authorized direct-upload capability.

Use:

- presigned multipart upload;
- size/type restrictions;
- expiration;
- server-side metadata binding to movieId.

Accepted media policy [0026](../decisions/0026-sprint-1-users-movie-policies.md) further limits uploads to `video/mp4`, `video/quicktime`, or `video/x-matroska`, with `1,000,000 < sizeBytes <= 25,000,000,000`; abandoned multipart uploads older than 24 hours are aborted and cleaned up. HLS access is signed for 600 seconds and must cover the master playlist, child playlists, and segments while keeping the bucket private. These are requirements; verify each against the Movie implementation and deployment before release.

---

## Service identity

Detailed mTLS/internal-service identity is deferred.

At minimum:

- services are not directly exposed without need;
- internal network policies should restrict DB/broker access;
- secrets are not committed to repositories.
- Users profile bootstrap and Movie transcode callbacks stay on the private
  service network; the public Gateway exposes only its explicit route allowlist.
  This deployment boundary is assumed wherever those service endpoints run.

---

## Data boundaries

- Auth owns sensitive credential data.
- Other services should not copy passwords/refresh credentials.
- Services receive only identity claims/IDs they need.

---

## Security items for later detailed design

- Argon2id parameters, compensation behavior, and first-admin operator command are fixed by [0021](../decisions/0021-auth-policy-gates.md); verify implementation and operator procedure against the decision;
- cookie topology, SameSite and CSRF enforcement at implementation time (storage choice accepted in 0025);
- full signing-key rotation ceremony and JWKS refresh/distribution timing;
- account recovery;
- email verification;
- rate limiting per endpoint;
- abuse prevention;
- audit log;
- admin provisioning policy accepted in 0021; operator command and scope enforcement still required;
- upload malware/content validation;
- DRM if required.

## Implementation alignment

The accepted browser policy in [0025](../decisions/0025-browser-session-storage.md) requires refresh-token in an HttpOnly cookie and access-token only in memory. The connected client currently stores both values in `sessionStorage` (`src/lib/auth/token-storage.ts`); this is an implementation gap and must be closed before claiming the browser session policy is satisfied. The policy also requires production `Secure`, logout revocation/cookie clearing, and same-origin invite return. Track these checks with the client tickets. Room invitation persistence and outbox publication require the Rooms-owned PostgreSQL in [0023](../decisions/0023-rooms-durable-storage.md); Redis-only persistence does not satisfy that decision.
