const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");

test("PasswordHasherService uses accepted Argon2id parameters and verifies hashes", async () => {
  const { ARGON2ID_PASSWORD_OPTIONS, PasswordHasherService } = await import(
    pathToFileURL(
      resolve(__dirname, "../dist/modules/auth/password-hasher.service.js"),
    )
  );
  const service = new PasswordHasherService();
  const password = "correct Horse Battery Staple 123";
  const encodedHash = await service.hashPassword(password);

  assert.match(encodedHash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(await service.verifyPassword(encodedHash, password), true);
  assert.equal(
    await service.verifyPassword(encodedHash, "incorrect password"),
    false,
  );
  assert.deepEqual(ARGON2ID_PASSWORD_OPTIONS, {
    type: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
});

test("PasswordHasherService generates an independent 16-byte salt per hash", async () => {
  const { PasswordHasherService } = await import(
    pathToFileURL(
      resolve(__dirname, "../dist/modules/auth/password-hasher.service.js"),
    )
  );
  const service = new PasswordHasherService();
  const firstHash = await service.hashPassword("same password");
  const secondHash = await service.hashPassword("same password");

  assert.equal(Buffer.from(firstHash.split("$")[4], "base64").length, 16);
  assert.equal(Buffer.from(secondHash.split("$")[4], "base64").length, 16);
  assert.notEqual(firstHash, secondHash);
});
