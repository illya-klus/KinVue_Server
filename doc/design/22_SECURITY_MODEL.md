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

---

## Service identity

Detailed mTLS/internal-service identity is deferred.

At minimum:

- services are not directly exposed without need;
- internal network policies should restrict DB/broker access;
- secrets are not committed to repositories.

---

## Data boundaries

- Auth owns sensitive credential data.
- Other services should not copy passwords/refresh credentials.
- Services receive only identity claims/IDs they need.

---

## Security items for later detailed design

- Argon2id parameters are accepted in [0021](../decisions/0021-auth-policy-gates.md), implementation still required;
- cookie topology, SameSite and CSRF enforcement at implementation time (storage choice accepted in 0025);
- key rotation/JWKS;
- account recovery;
- email verification;
- rate limiting per endpoint;
- abuse prevention;
- audit log;
- admin provisioning policy accepted in 0021; operator command and scope enforcement still required;
- upload malware/content validation;
- DRM if required.
