const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { test } = require("node:test");

test("refresh tokens are opaque, stored only as hashes, and expire in 30 days", async () => {
  const { TokensService, REFRESH_TOKEN_TTL_SECONDS } =
    await import("../dist/modules/tokens/tokens.service.js");
  const rows = new Map();
  const prisma = {
    db: {
      orm: {
        public: {
          RefreshSession: {
            async create(row) {
              rows.set(row.tokenHash, row);
              return row;
            },
            async first(where) {
              return rows.get(where.tokenHash) ?? null;
            },
          },
        },
      },
    },
  };
  const jwt = {
    async signAsync() {
      return "access-token";
    },
  };
  const service = new TokensService(
    { getOrThrow: () => "unused-refresh-secret" },
    jwt,
    { getPrivateKey: () => "unused", getKeyId: () => "test-key" },
    prisma,
    {
      async rotate() {
        return null;
      },
      async revoke() {},
    },
  );

  const before = Date.now();
  const { accessToken, refreshToken } = await service.createTokenPair(
    "user-1",
    "USER",
  );
  const hash = createHash("sha256").update(refreshToken).digest("hex");
  const row = rows.get(hash);

  assert.equal(accessToken, "access-token");
  assert.match(refreshToken, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(row);
  assert.notEqual(row.tokenHash, refreshToken);
  assert.equal(row.userId, "user-1");
  assert.equal(REFRESH_TOKEN_TTL_SECONDS, 30 * 24 * 60 * 60);
  assert.ok(
    Date.parse(row.expiresAt) >= before + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );
  assert.ok(
    Date.parse(row.expiresAt) <= Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  );
  assert.deepEqual(await service.verifyRefreshToken(refreshToken), {
    sub: "user-1",
    sessionId: row.id,
  });
});

test("refresh verification rejects revoked and expired sessions", async () => {
  const { TokensService } =
    await import("../dist/modules/tokens/tokens.service.js");
  let session = null;
  const prisma = {
    db: {
      orm: {
        public: {
          RefreshSession: {
            async first() {
              return session;
            },
          },
        },
      },
    },
  };
  const service = new TokensService(
    {},
    {},
    { getPrivateKey: () => "unused", getKeyId: () => "test-key" },
    prisma,
    {
      async rotate() {
        return null;
      },
      async revoke() {},
    },
  );
  const token = "opaque-refresh-token";
  const tokenHash = createHash("sha256").update(token).digest("hex");

  session = {
    id: "session-1",
    userId: "user-1",
    revokedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  assert.equal(await service.verifyRefreshToken(token), null);
  session = {
    ...session,
    revokedAt: null,
    expiresAt: new Date(Date.now() - 1).toISOString(),
  };
  assert.equal(await service.verifyRefreshToken(token), null);
  assert.equal(tokenHash.length, 64);
});

test("refresh rotates an active password identity without a legacy AuthUser", async () => {
  const { TokensService } =
    await import("../dist/modules/tokens/tokens.service.js");
  let scopes;
  let identityLookup;
  const prisma = {
    db: {
      orm: {
        public: {
          AuthIdentity: {
            async first(where) {
              identityLookup = where;
              return { userId: "password-user", status: "ACTIVE" };
            },
          },
          AuthUser: {
            async first() {
              return null;
            },
          },
        },
      },
    },
  };
  const service = new TokensService(
    {},
    {
      async signAsync(payload) {
        scopes = payload.scopes;
        return "new-access-token";
      },
    },
    { getPrivateKey: () => "unused", getKeyId: () => "test-key" },
    prisma,
    {
      async rotate() {
        return { userId: "password-user", sessionId: "next-session" };
      },
      async revoke() {},
    },
  );

  const tokens = await service.rotateRefreshToken("old-refresh-token");

  assert.equal(tokens.accessToken, "new-access-token");
  assert.match(tokens.refreshToken, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(identityLookup, { userId: "password-user" });
  assert.deepEqual(scopes, []);
});

test("refresh rejects a disabled password identity", async () => {
  const { TokensService } =
    await import("../dist/modules/tokens/tokens.service.js");
  let authUserLookups = 0;
  const service = new TokensService(
    {},
    {},
    {},
    {
      db: {
        orm: {
          public: {
            AuthIdentity: {
              async first() {
                return { status: "DISABLED" };
              },
            },
            AuthUser: {
              async first() {
                authUserLookups += 1;
                return null;
              },
            },
          },
        },
      },
    },
    {
      async rotate() {
        return { userId: "disabled-user", sessionId: "revoked-session" };
      },
      async revoke() {},
    },
  );

  assert.equal(await service.rotateRefreshToken("old-refresh-token"), null);
  assert.equal(authUserLookups, 0);
});
