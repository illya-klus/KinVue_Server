const assert = require("node:assert/strict");
const { test } = require("node:test");

test("registration creates a PENDING identity with a generated UUID and password hash", async () => {
  const { AuthService } = await import("../dist/modules/auth/auth.service.js");
  let stored;
  const service = new AuthService(
    {},
    { db: { orm: { public: {} } } },
    {
      async hashPassword(password) {
        return `argon2id:${password}`;
      },
    },
    {
      async createPending(userId, email, passwordHash) {
        stored = { userId, email, passwordHash, status: "PENDING" };
      },
    },
  );
  const result = await service.createPendingRegistration({
    email: "user@example.com",
    password: "original-secret",
    username: "user_1",
    displayName: "User One",
  });

  assert.match(result.userId, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  assert.deepEqual(result, { userId: stored.userId, status: "PENDING" });
  assert.equal(stored.email, "user@example.com");
  assert.equal(stored.status, "PENDING");
  assert.equal(stored.passwordHash, "argon2id:original-secret");
  assert.notEqual(stored.passwordHash, "original-secret");
});

test("duplicate registration email maps to HTTP 409", async () => {
  const [{ AuthIdentityRepository }, { ConflictException }] = await Promise.all(
    [
      import("../dist/modules/auth/auth-identity.repository.js"),
      import("@nestjs/common"),
    ],
  );
  const repository = new AuthIdentityRepository({
    db: {
      orm: {
        public: {
          AuthIdentity: {
            async create() {
              throw {
                code: "23505",
                constraint: "auth_identities_email_key",
              };
            },
          },
        },
      },
    },
  });

  await assert.rejects(
    repository.createPending("generated-user-id", "user@example.com", "hash"),
    { constructor: ConflictException, status: 409 },
  );
});

test("registration endpoint rejects malformed input before calling the saga", async () => {
  const { AuthController } =
    await import("../dist/modules/auth/auth.controller.js");
  let called = false;
  const controller = new AuthController(
    {
      async createPendingRegistration() {
        called = true;
      },
    },
    {},
    {},
  );

  await assert.rejects(controller.register({ email: "bad" }), { status: 400 });
  assert.equal(called, false);
});
