const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, createPublicKey } = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");

function makeKeyPair(modulusLength = 2048) {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return privateKey;
}

async function loadSigningKeyService() {
  return import(
    pathToFileURL(
      resolve(__dirname, "../dist/modules/tokens/signing-key.service.js"),
    )
  );
}

test("publishes only the RS256 public JWK with its key id", async () => {
  const { SigningKeyService } = await loadSigningKeyService();
  const privateKey = makeKeyPair();
  const service = new SigningKeyService({
    getOrThrow: (name) =>
      ({ AUTH_JWT_PRIVATE_KEY: privateKey, AUTH_JWT_KEY_ID: "auth-test-key" })[
        name
      ],
  });
  const jwks = service.getJwks();
  const [jwk] = jwks.keys;
  const expectedPublicKey = createPublicKey(privateKey).export({
    format: "jwk",
  });

  assert.equal(jwks.keys.length, 1);
  assert.equal(jwk.kty, "RSA");
  assert.equal(jwk.alg, "RS256");
  assert.equal(jwk.kid, "auth-test-key");
  assert.equal(jwk.use, "sig");
  assert.equal(jwk.n, expectedPublicKey.n);
  assert.equal(jwk.e, expectedPublicKey.e);
  for (const privateMember of ["d", "p", "q", "dp", "dq", "qi", "oth"]) {
    assert.equal(Object.hasOwn(jwk, privateMember), false);
  }
});

test("refuses invalid or undersized private keys", async () => {
  const { SigningKeyService } = await loadSigningKeyService();
  assert.throws(
    () =>
      new SigningKeyService({
        getOrThrow: (name) =>
          ({ AUTH_JWT_PRIVATE_KEY: "not a PEM key", AUTH_JWT_KEY_ID: "test" })[
            name
          ],
      }),
    /valid RSA private key/,
  );
  assert.throws(
    () =>
      new SigningKeyService({
        getOrThrow: (name) =>
          ({
            AUTH_JWT_PRIVATE_KEY: makeKeyPair(1024),
            AUTH_JWT_KEY_ID: "test",
          })[name],
      }),
    /at least 2048 bits/,
  );
});

test("exposes the standard public JWKS route", async () => {
  const { JwksController } = await import(
    pathToFileURL(
      resolve(__dirname, "../dist/modules/tokens/jwks.controller.js"),
    )
  );
  const {
    METHOD_METADATA,
    PATH_METADATA,
  } = require("@nestjs/common/constants");

  assert.equal(
    Reflect.getMetadata(PATH_METADATA, JwksController),
    ".well-known",
  );
  assert.equal(
    Reflect.getMetadata(PATH_METADATA, JwksController.prototype.getJwks),
    "jwks.json",
  );
  assert.equal(
    Reflect.getMetadata(METHOD_METADATA, JwksController.prototype.getJwks),
    0,
  );
});
