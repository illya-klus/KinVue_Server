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
- JWT validation at Gateway;
- rate limiting;
- authorization;
- validation.

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

- short-lived;
- validated locally;
- not checked against Auth DB on every request.

### Refresh token

- longer-lived;
- processed by Auth;
- rotation/revocation strategy deferred to detailed design.

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

- password hashing parameters;
- refresh token storage;
- key rotation/JWKS;
- account recovery;
- email verification;
- rate limiting per endpoint;
- abuse prevention;
- audit log;
- admin authorization;
- upload malware/content validation;
- DRM if required.
