import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT, type JWTPayload } from "jose";
import {
  createJwtVerifier,
  JwtVerificationError,
  type JwtFailure,
} from "../src/index.ts";

test("local verifier checks signature, lifetime, issuer, audience, kid, claims and scopes", async () => {
  const pair = await generateKeyPair("RS256");
  const other = await generateKeyPair("RS256");
  const jwks = {
    keys: [
      {
        ...(await exportJWK(pair.publicKey)),
        kid: "key-1",
        alg: "RS256",
        use: "sig",
      },
    ],
  };
  const now = new Date("2026-10-28T12:00:00Z");
  const seconds = now.getTime() / 1000;
  const claims = {
    sub: "global-user-id",
    iss: "kinvue-auth",
    aud: "kinvue",
    iat: seconds,
    exp: seconds + 900,
    scopes: ["user"],
  };
  const sign = (payload: JWTPayload, key = pair.privateKey, kid = "key-1") =>
    new SignJWT(payload).setProtectedHeader({ alg: "RS256", kid }).sign(key);
  const verify = createJwtVerifier(jwks, {
    issuer: "kinvue-auth",
    audience: "kinvue",
    now: () => now,
  });
  assert.deepEqual(await verify(await sign(claims), ["user"]), {
    userId: "global-user-id",
    scopes: ["user"],
  });
  const failure = async (
    token: string,
    reason: JwtFailure,
    scopes: string[] = [],
  ) =>
    assert.rejects(
      verify(token, scopes),
      (error) =>
        error instanceof JwtVerificationError && error.reason === reason,
    );
  await failure(await sign({ ...claims, exp: seconds - 1 }), "EXPIRED");
  await failure(await sign(claims, other.privateKey), "INVALID_SIGNATURE");
  await failure(await sign({ ...claims, iss: "attacker" }), "INVALID_ISSUER");
  await failure(
    await sign({ ...claims, aud: "another-app" }),
    "INVALID_AUDIENCE",
  );
  await failure(await sign(claims), "MISSING_SCOPE", ["admin"]);
  await failure(await sign(claims, pair.privateKey, "unknown"), "UNKNOWN_KEY");
  await failure(await sign({ ...claims, exp: undefined }), "INVALID_TOKEN");
  await failure(await sign({ ...claims, scopes: "admin" }), "INVALID_TOKEN");
  await failure(await sign({ ...claims, nbf: seconds + 60 }), "INVALID_TOKEN");
  await failure(await sign({ ...claims, iat: seconds + 60 }), "INVALID_TOKEN");
  await failure("malformed", "INVALID_TOKEN");
  const hmac = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", kid: "key-1" })
    .sign(new TextEncoder().encode("a".repeat(32)));
  await failure(hmac, "INVALID_TOKEN");
});
test("keyset is copied: changing the caller's keys cannot switch trust", async () => {
  const pair = await generateKeyPair("RS256");
  const jwks = { keys: [{ ...(await exportJWK(pair.publicKey)), kid: "key" }] };
  const verify = createJwtVerifier(jwks, {
    issuer: "issuer",
    audience: "audience",
  });
  jwks.keys.length = 0;
  const token = await new SignJWT({ scopes: [] })
    .setProtectedHeader({ alg: "RS256", kid: "key" })
    .setSubject("user")
    .setIssuer("issuer")
    .setAudience("audience")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(pair.privateKey);
  assert.equal((await verify(token)).userId, "user");
});
