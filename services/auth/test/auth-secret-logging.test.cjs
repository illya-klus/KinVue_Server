const assert = require("node:assert/strict");
const { test } = require("node:test");

test("login, registration, refresh, and logout logs never contain credentials", async () => {
  const { AuthController } =
    await import("../dist/modules/auth/auth.controller.js");
  const secrets = [
    "password-sentinel-value",
    "password-hash-sentinel",
    "access-token-sentinel",
    "refresh-token-sentinel",
  ];
  const lines = [];
  const write = process.stdout.write;
  process.stdout.write = function (chunk) {
    lines.push(Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk));
    return true;
  };

  try {
    const controller = new AuthController(
      {
        async findLoginIdentityByEmail() {
          return {
            userId: "user-1",
            status: "ACTIVE",
            passwordHash: secrets[1],
          };
        },
        async roleForIdentity() {
          return "USER";
        },
      },
      {
        async createTokenPair() {
          return {
            accessToken: secrets[2],
            refreshToken: secrets[3],
          };
        },
        async rotateRefreshToken() {
          return {
            accessToken: secrets[2],
            refreshToken: secrets[3],
          };
        },
        async revokeRefreshToken() {},
      },
      {
        async verifyPassword() {
          return true;
        },
      },
      {
        async register() {
          return { userId: "user-2" };
        },
      },
    );
    const response = {
      cookie() {},
      clearCookie() {},
    };

    await controller.login(
      { email: "person@example.com", password: secrets[0] },
      response,
    );
    await controller.register({
      email: "new@example.com",
      username: "new_user",
      displayName: "New User",
      password: secrets[0],
    });
    const request = { headers: { cookie: `kinvue_refresh=${secrets[3]}` } };
    await controller.refresh(request, response);
    await controller.logout(request, response);
  } finally {
    process.stdout.write = write;
  }

  const output = lines.join("");
  for (const secret of secrets)
    assert.equal(output.includes(secret), false, secret);
  for (const event of [
    "login succeeded",
    "registration completed",
    "refresh succeeded",
    "logout completed",
  ])
    assert.equal(output.includes(event), true, event);
});
