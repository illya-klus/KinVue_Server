const assert = require("node:assert/strict");
const { test } = require("node:test");

async function setup(identity, passwordMatches = true) {
  const [{ AuthController }, { UnauthorizedException }] = await Promise.all([
    import("../dist/modules/auth/auth.controller.js"),
    import("@nestjs/common"),
  ]);
  const calls = { email: null, verify: 0, cookies: [], tokens: 0 };
  const controller = new AuthController(
    {
      async findLoginIdentityByEmail(email) {
        calls.email = email;
        return identity;
      },
    },
    {
      async createTokenPair(userId, role) {
        calls.tokens += 1;
        calls.tokenUser = { userId, role };
        return { accessToken: "access-secret", refreshToken: "refresh-secret" };
      },
    },
    {
      async verifyPassword() {
        calls.verify += 1;
        return passwordMatches;
      },
    },
  );
  const response = {
    cookie(name, value, options) {
      calls.cookies.push({ name, value, options });
    },
  };
  return { controller, response, calls, UnauthorizedException };
}

test("active identity logs in, gets access response and HttpOnly refresh cookie", async () => {
  const setupResult = await setup({
    userId: "user-1",
    status: "ACTIVE",
    passwordHash: "argon-hash",
  });
  const result = await setupResult.controller.login(
    { email: "  PERSON@EXAMPLE.COM ", password: "correct-horse-battery" },
    setupResult.response,
  );

  assert.deepEqual(result, { accessToken: "access-secret" });
  assert.equal(setupResult.calls.email, "person@example.com");
  assert.deepEqual(setupResult.calls.tokenUser, {
    userId: "user-1",
    role: "USER",
  });
  assert.equal(setupResult.calls.cookies[0].name, "kinvue_refresh");
  assert.equal(setupResult.calls.cookies[0].value, "refresh-secret");
  assert.equal(setupResult.calls.cookies[0].options.httpOnly, true);
});

test("unknown email and wrong password return the same unauthorized response", async () => {
  const unknown = await setup(null);
  const wrong = await setup(
    { userId: "user-1", status: "ACTIVE", passwordHash: "argon-hash" },
    false,
  );
  const request = { email: "person@example.com", password: "incorrect" };

  await assert.rejects(unknown.controller.login(request, unknown.response), {
    constructor: unknown.UnauthorizedException,
    status: 401,
    message: "Invalid email or password",
  });
  await assert.rejects(wrong.controller.login(request, wrong.response), {
    constructor: wrong.UnauthorizedException,
    status: 401,
    message: "Invalid email or password",
  });
});

test("non-active identities cannot log in", async () => {
  const result = await setup({
    userId: "user-1",
    status: "PENDING",
    passwordHash: "argon-hash",
  });

  await assert.rejects(
    result.controller.login(
      { email: "person@example.com", password: "correct-horse-battery" },
      result.response,
    ),
    { status: 401, message: "Invalid email or password" },
  );
  assert.equal(result.calls.verify, 0);
  assert.equal(result.calls.tokens, 0);
});
