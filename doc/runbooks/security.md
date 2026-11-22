# Security operations

This runbook records the security controls currently implemented in the server and the accepted policies that operators should preserve. Keep private keys, passwords, refresh tokens, invite tokens, and database credentials out of source control, issue comments, and shared logs.

## Authentication and sessions

- Access tokens use RS256 and expire after 15 minutes. Gateway checks the signature, issuer, audience, expiry, and required scopes. Auth publishes public keys at `/.well-known/jwks.json`; configure its private key outside Git as described in [auth-jwks-local.md](auth-jwks-local.md).
- Refresh tokens last 30 days. The browser receives `kinvue_refresh` as an HttpOnly, SameSite=Strict cookie; it is Secure when `NODE_ENV=production`. Auth stores only a SHA-256 hash, rotates the session on refresh, and revokes it on logout. Access tokens belong in browser memory, not localStorage.
- Gateway limits login to 5 and registration to 3 requests per minute per IP or authenticated user. Other authenticated API routes use 300 per minute. Limits are in memory per Gateway process in local development, so they are not shared between replicas.
- Password reset and email verification are not implemented in v1. Support must not promise either flow; account recovery and verified-email-only actions need a later feature.

## First administrator

There is no public admin-promotion endpoint. An operator must verify the person's identity out of band, obtain the exact global user UUID, and run the local Auth command against the intended `kinvue` PostgreSQL database:

```sh
pnpm --filter @kinvue/auth admin:grant -- --user-id <user-uuid>
```

The command only promotes an existing `ACTIVE` identity. It accepts `AUTH_DATABASE_URL` or `DATABASE_URL`, and rejects a database URL whose path is not `/kinvue`. Record the promotion in the operator audit without credentials or tokens. The user must sign in again to receive a token with the `admin` scope.

## Request and media limits

- Gateway JSON request bodies are limited to 1 MiB. The upload API sends file parts directly to object storage using presigned URLs; do not proxy movie bytes through the application API.
- Movie upload metadata accepts a file larger than 1 MiB and no larger than 25 GiB (25 × 1024³ bytes). Multipart part count is bounded by the file size, and each presigned part URL expires after one hour.
- A signed media URL is a bearer capability, not DRM. Anyone who obtains the URL can use it within its scope and expiry; it cannot prevent copying, screen recording, or capture after playback.

## Private rooms and invitations

- Room IDs are not credentials. A private room requires an authenticated owner, an existing participant, a direct invite addressed to that user, or a valid invite-link token.
- The accepted maximum is 20 participants. Roles are `OWNER`, `CONTROLLER`, and `VIEWER`; direct and link invitees default to `VIEWER`. Only the owner can invite users, change member permissions, or close the room.
- Invite-link tokens contain 32 random bytes. The Rooms database stores only their SHA-256 hash; the plaintext is returned once to the owner. Accepting a link requires authentication and a free room slot. The token expires no later than the room and closing a room revokes pending invites.
- The accepted lifecycle policy is a six-hour inactive-room TTL, reduced to 15 minutes after owner close. Heartbeats are expected every 30 seconds and presence older than 75 seconds is stale. Chat history is ephemeral and does not outlive room deletion.
- The browser link format is `<WEB_ORIGIN>/invite/<roomId>#token=<opaque-token>`. The fragment is read by the client and submitted to the authenticated join API; do not put invite tokens in server access logs or analytics.

## Security checks

Run the auth and authorization checks after changing these controls:

```sh
pnpm --filter @kinvue/auth test:tokens
pnpm --filter @kinvue/auth test:refresh
pnpm --filter @kinvue/auth test:admin-grant
pnpm --filter @kinvue/gateway exec jest --runInBand
pnpm --filter @kinvue/room exec jest --runInBand
```

Relevant test sources: [access-token tests](../../services/auth/test/access-tokens.test.cjs), [refresh-session tests](../../services/auth/test/refresh-sessions.test.cjs), [admin grant tests](../../services/auth/test/admin-grant.test.cjs), [Gateway admin authorization test](../../services/gateway/src/modules/proxy/gateway-proxy.auth.spec.ts), and [room access tests](../../services/room/src/rooms.service.spec.ts).
