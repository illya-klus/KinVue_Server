const assert = require("node:assert/strict");
const { test } = require("node:test");

test("registration identity moves through PROFILE_CREATING before Users and ACTIVE after", async () => {
  const { RegistrationSagaService } =
    await import("../dist/modules/auth/registration-saga.service.js");
  const timeline = [];
  let stored;
  const service = new RegistrationSagaService(
    {
      async createPending(userId, email, passwordHash) {
        stored = { userId, email, passwordHash, status: "PENDING" };
        timeline.push("PENDING");
      },
      async transitionStatus(userId, _from, to) {
        assert.equal(userId, stored.userId);
        timeline.push(to);
        stored.status = to;
      },
    },
    {
      async hashPassword(password) {
        return `argon2id:${password}`;
      },
    },
    {
      async createProfile(profile) {
        assert.equal(stored.status, "PROFILE_CREATING");
        assert.equal(profile.userId, stored.userId);
        assert.equal(profile.username, "user_1");
        assert.equal(profile.displayName, "User One");
        timeline.push("USERS");
      },
    },
  );
  const result = await service.register({
    email: "user@example.com",
    password: "original-secret",
    username: "user_1",
    displayName: "User One",
  });

  assert.match(result.userId, /^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  assert.deepEqual(result, { userId: stored.userId, status: "ACTIVE" });
  assert.equal(stored.email, "user@example.com");
  assert.equal(stored.status, "ACTIVE");
  assert.equal(stored.passwordHash, "argon2id:original-secret");
  assert.notEqual(stored.passwordHash, "original-secret");
  assert.deepEqual(timeline, [
    "PENDING",
    "PROFILE_CREATING",
    "USERS",
    "ACTIVE",
  ]);
});

test("registration does not activate an identity before Users confirms its profile", async () => {
  const { RegistrationSagaService } =
    await import("../dist/modules/auth/registration-saga.service.js");
  const transitions = [];
  const service = new RegistrationSagaService(
    {
      async createPending() {},
      async transitionStatus(_userId, _from, to) {
        transitions.push(to);
      },
    },
    {
      async hashPassword() {
        return "hash";
      },
    },
    {
      async createProfile() {
        throw new Error("service unavailable");
      },
    },
  );

  await assert.rejects(
    service.register({
      email: "user@example.com",
      password: "long-enough-password",
      username: "user_1",
      displayName: "User One",
    }),
    /service unavailable/,
  );
  assert.deepEqual(transitions, ["PROFILE_CREATING"]);
});

test("Users client posts the same global user id to the internal profile endpoint", async () => {
  const { UsersProfileClient } =
    await import("../dist/modules/auth/users-profile.client.js");
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      async json() {
        return { userId: "global-user-id" };
      },
    };
  };
  try {
    const client = new UsersProfileClient({
      getOrThrow: () => "http://users.local:4002/",
    });
    await client.createProfile({
      userId: "global-user-id",
      username: "user_1",
      displayName: "User One",
    });
  } finally {
    global.fetch = originalFetch;
  }

  assert.equal(request.url, "http://users.local:4002/internal/profiles");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), {
    userId: "global-user-id",
    username: "user_1",
    displayName: "User One",
  });
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
    {},
    {},
    {},
    {
      async register() {
        called = true;
      },
    },
  );

  await assert.rejects(controller.register({ email: "bad" }), { status: 400 });
  assert.equal(called, false);
});
