const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { generateKeyPairSync } = require("node:crypto");
const { test } = require("node:test");

test("password hashes use Argon2id and verify without storing plaintext", async () => {
  const { PasswordHasherService } =
    await import("../dist/modules/auth/password-hasher.service.js");
  const service = new PasswordHasherService();
  const password = "a-long-test-password";
  const encoded = await service.hashPassword(password);

  assert.match(encoded, /^\$argon2id\$/);
  assert.notEqual(encoded, password);
  assert.equal(await service.verifyPassword(encoded, password), true);
  assert.equal(
    await service.verifyPassword(encoded, "incorrect-password"),
    false,
  );
});

test("access tokens contain subject, userId, scope, issuer, audience and 15-minute TTL", async () => {
  const [{ TokensService }, { JwtService }, { SigningKeyService }] =
    await Promise.all([
      import("../dist/modules/tokens/tokens.service.js"),
      import("@nestjs/jwt"),
      import("../dist/modules/tokens/signing-key.service.js"),
    ]);
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const signingKey = new SigningKeyService({
    getOrThrow: (name) =>
      ({ AUTH_JWT_PRIVATE_KEY: privateKey, AUTH_JWT_KEY_ID: "test-key" })[name],
  });
  const jwt = new JwtService();
  let storedSession;
  const prisma = {
    db: {
      orm: {
        public: {
          RefreshSession: {
            async create(row) {
              storedSession = row;
            },
          },
        },
      },
    },
  };
  const service = new TokensService({}, jwt, signingKey, prisma, {});

  const pair = await service.createTokenPair("user-123", "ADMIN");
  const claims = await service.verifyAccessToken(pair.accessToken);

  assert.equal(claims.sub, "user-123");
  assert.equal(claims.userId, claims.sub);
  assert.deepEqual(claims.scopes, ["admin"]);
  assert.equal(claims.iss, "kinvue-auth");
  assert.equal(claims.aud, "kinvue");
  assert.equal(claims.exp - claims.iat, 15 * 60);
  assert.notEqual(storedSession.tokenHash, pair.refreshToken);
  assert.equal(
    storedSession.tokenHash,
    createHash("sha256").update(pair.refreshToken).digest("hex"),
  );
});

test("inactive identities cannot produce tokens and receive the standard 401", async () => {
  const [{ AuthController }, { UnauthorizedException }] = await Promise.all([
    import("../dist/modules/auth/auth.controller.js"),
    import("@nestjs/common"),
  ]);
  let tokenCalls = 0;
  let passwordChecks = 0;
  const controller = new AuthController(
    {
      async findLoginIdentityByEmail() {
        return {
          userId: "user-123",
          status: "DISABLED",
          passwordHash: "hash",
        };
      },
    },
    {
      async createTokenPair() {
        tokenCalls += 1;
      },
    },
    {
      async verifyPassword() {
        passwordChecks += 1;
        return true;
      },
    },
    {},
  );

  await assert.rejects(
    controller.login(
      { email: "user@example.com", password: "long-password-value" },
      { cookie() {} },
    ),
    {
      constructor: UnauthorizedException,
      status: 401,
      message: "Invalid email or password",
    },
  );
  assert.equal(tokenCalls, 0);
  assert.equal(passwordChecks, 0);
});

test("duplicate email constraint maps to 409 without exposing database details", async () => {
  const [{ AuthIdentityRepository }, { ConflictException }] = await Promise.all(
    [
      import("../dist/modules/auth/auth-identity.repository.js"),
      import("@nestjs/common"),
    ],
  );
  const repository = new AuthIdentityRepository({
    pool: {
      async query() {
        const error = new Error("database duplicate");
        error.code = "23505";
        error.constraint = "auth_identities_email_key";
        throw error;
      },
    },
  });

  await assert.rejects(
    repository.createPending("user-id", "user@example.com", "password-hash"),
    { constructor: ConflictException, status: 409 },
  );
});
