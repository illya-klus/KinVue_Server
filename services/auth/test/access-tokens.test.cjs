const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const { JwtService } = require("@nestjs/jwt");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");

async function loadTokenTypes() {
  const [tokens, keys] = await Promise.all([
    import(
      pathToFileURL(
        resolve(__dirname, "../dist/modules/tokens/tokens.service.js"),
      )
    ),
    import(
      pathToFileURL(
        resolve(__dirname, "../dist/modules/tokens/signing-key.service.js"),
      )
    ),
  ]);
  return { ...tokens, ...keys };
}

function createKeys() {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return privateKey;
}

test("issues and verifies access tokens with the required RS256 claims", async () => {
  const { SigningKeyService, TokensService } = await loadTokenTypes();
  const privateKey = createKeys();
  const signingKey = new SigningKeyService({
    getOrThrow: (name) =>
      ({ AUTH_JWT_PRIVATE_KEY: privateKey, AUTH_JWT_KEY_ID: "test-key-1" })[
        name
      ],
  });
  const tokens = new TokensService(
    { getOrThrow: () => "refresh-test-secret" },
    new JwtService(),
    signingKey,
  );
  const userId = "e3aa40c8-3fcf-4d96-9c6a-998c31ef54c3";
  const pair = await tokens.createTokenPair(userId, "ADMIN");
  const claims = await tokens.verifyAccessToken(pair.accessToken);
  const [header] = pair.accessToken.split(".");
  const decodedHeader = JSON.parse(
    Buffer.from(header, "base64url").toString("utf8"),
  );

  assert.equal(decodedHeader.alg, "RS256");
  assert.equal(decodedHeader.kid, "test-key-1");
  assert.equal(claims.sub, userId);
  assert.equal(claims.userId, userId);
  assert.equal(claims.iss, "kinvue-auth");
  assert.equal(claims.aud, "kinvue");
  assert.deepEqual(claims.scopes, ["admin"]);
  assert.equal(claims.exp - claims.iat, 15 * 60);
});

test("issues a scopes claim for a regular user", async () => {
  const { SigningKeyService, TokensService } = await loadTokenTypes();
  const signingKey = new SigningKeyService({
    getOrThrow: (name) =>
      ({ AUTH_JWT_PRIVATE_KEY: createKeys(), AUTH_JWT_KEY_ID: "test-key-2" })[
        name
      ],
  });
  const tokens = new TokensService(
    { getOrThrow: () => "refresh-test-secret" },
    new JwtService(),
    signingKey,
  );
  const pair = await tokens.createTokenPair("regular-user", "USER");
  const claims = await tokens.verifyAccessToken(pair.accessToken);

  assert.deepEqual(claims.scopes, []);
});
