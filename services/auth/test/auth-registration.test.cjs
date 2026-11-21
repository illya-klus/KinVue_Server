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
    async () => {},
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
    async () => {},
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

test("registration retries Users with the same user ID and advances after success", async () => {
  const [{ RegistrationSagaService }, { ServiceUnavailableException }] =
    await Promise.all([
      import("../dist/modules/auth/registration-saga.service.js"),
      import("@nestjs/common"),
    ]);
  const attempts = [];
  const delays = [];
  const transitions = [];
  let createdUserId;
  const service = new RegistrationSagaService(
    {
      async createPending(userId) {
        createdUserId = userId;
      },
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
      async createProfile(profile) {
        attempts.push(profile.userId);
        if (attempts.length < 3) throw new ServiceUnavailableException();
      },
    },
    async (milliseconds) => {
      delays.push(milliseconds);
    },
  );

  const result = await service.register({
    email: "user@example.com",
    password: "long-enough-password",
    username: "user_1",
    displayName: "User One",
  });

  assert.equal(result.status, "ACTIVE");
  assert.equal(attempts[0], createdUserId);
  assert.equal(new Set(attempts).size, 1);
  assert.equal(attempts.length, 3);
  assert.deepEqual(delays, [100, 250]);
  assert.deepEqual(transitions, ["PROFILE_CREATING", "ACTIVE"]);
});

test("three Users failures reject registration without activating the identity", async () => {
  const [{ RegistrationSagaService }, { ServiceUnavailableException }] =
    await Promise.all([
      import("../dist/modules/auth/registration-saga.service.js"),
      import("@nestjs/common"),
    ]);
  const attempts = [];
  const delays = [];
  const transitions = [];
  const service = new RegistrationSagaService(
    {
      async createPending() {},
      async transitionStatus(_userId, _from, to) {
        transitions.push(to);
      },
      async compensateRegistration() {
        transitions.push("COMPENSATING", "COMPENSATED");
      },
    },
    {
      async hashPassword() {
        return "hash";
      },
    },
    {
      async createProfile(profile) {
        attempts.push(profile.userId);
        throw new ServiceUnavailableException();
      },
    },
    async (milliseconds) => {
      delays.push(milliseconds);
    },
  );

  await assert.rejects(
    service.register({
      email: "user@example.com",
      password: "long-enough-password",
      username: "user_1",
      displayName: "User One",
    }),
    { status: 503 },
  );
  assert.equal(attempts.length, 3);
  assert.equal(new Set(attempts).size, 1);
  assert.deepEqual(delays, [100, 250]);
  assert.deepEqual(transitions, [
    "PROFILE_CREATING",
    "COMPENSATING",
    "COMPENSATED",
  ]);
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

test("Users client retries only network failures and HTTP 503 responses", async () => {
  const { UsersProfileClient } =
    await import("../dist/modules/auth/users-profile.client.js");
  const originalFetch = global.fetch;
  const client = new UsersProfileClient({
    getOrThrow: () => "http://users.local:4002",
  });
  const input = {
    userId: "global-user-id",
    username: "user_1",
    displayName: "User One",
  };
  try {
    global.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(client.createProfile(input), { status: 503 });
    global.fetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(client.createProfile(input), { status: 502 });
  } finally {
    global.fetch = originalFetch;
  }
});

test("duplicate registration email maps to HTTP 409", async () => {
  const [{ AuthIdentityRepository }, { ConflictException }] = await Promise.all(
    [
      import("../dist/modules/auth/auth-identity.repository.js"),
      import("@nestjs/common"),
    ],
  );
  const repository = new AuthIdentityRepository({
    pool: {
      async query() {
        throw {
          code: "23505",
          constraint: "auth_identities_email_key",
        };
      },
    },
  });

  await assert.rejects(
    repository.createPending("generated-user-id", "user@example.com", "hash"),
    { constructor: ConflictException, status: 409 },
  );
});

test("registration compensation clears credentials and releases the email", async () => {
  const { AuthIdentityRepository } =
    await import("../dist/modules/auth/auth-identity.repository.js");
  const statements = [];
  const repository = new AuthIdentityRepository({
    pool: {
      async query(sql, params) {
        statements.push({ sql, params });
        return { rowCount: 1 };
      },
    },
  });

  await repository.compensateRegistration("user-id");

  assert.equal(statements.length, 2);
  assert.match(statements[0].sql, /status = 'COMPENSATING'/);
  assert.match(statements[1].sql, /status = 'COMPENSATED'/);
  assert.match(statements[1].sql, /email = NULL, password_hash = NULL/);
  assert.deepEqual(
    statements.map(({ params }) => params),
    [["user-id"], ["user-id"]],
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
