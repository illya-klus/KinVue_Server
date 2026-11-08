import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateKeyPair, SignJWT } from "jose";
import { JwtVerificationService } from "./jwt-verification.service";
import type { JwksService } from "./jwks.service";

describe("JwtVerificationService (token outcomes)", () => {
  const issuer = "kinvue-auth";
  const audience = "kinvue";
  const kid = "test-key";

  let publicKey: CryptoKey;
  let privateKey: CryptoKey;
  let jwt: JwtVerificationService;

  beforeAll(async () => {
    const keys = await generateKeyPair("RS256");
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;

    const jwks = {
      getKey: jest.fn(async (requestedKid: string) => {
        if (requestedKid !== kid) {
          throw new Error("Unknown kid");
        }
        return publicKey;
      }),
    } as unknown as JwksService;

    jwt = new JwtVerificationService(
      {
        getOrThrow: (key: string) => {
          if (key === "JWT_ISSUER") return issuer;
          if (key === "JWT_AUDIENCE") return audience;
          throw new Error(key);
        },
      } as ConfigService,
      jwks,
    );
  });

  it("accepts valid token", async () => {
    const token = await new SignJWT({ userId: "user-1", scopes: ["user"] })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(privateKey);

    await expect(jwt.verifyBearer(`Bearer ${token}`)).resolves.toEqual({
      userId: "user-1",
      scopes: ["user"],
    });
  });

  it("returns 401 TOKEN_EXPIRED for expired token", async () => {
    const token = await new SignJWT({ userId: "user-1" })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("-1h")
      .sign(privateKey);

    await expect(jwt.verifyBearer(`Bearer ${token}`)).rejects.toMatchObject({
      response: { error: "TOKEN_EXPIRED", statusCode: 401 },
    });
    await expect(jwt.verifyBearer(`Bearer ${token}`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("returns 401 INVALID_TOKEN for bad signature", async () => {
    const other = await generateKeyPair("RS256");
    const token = await new SignJWT({ userId: "user-1" })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(other.privateKey);

    await expect(jwt.verifyBearer(`Bearer ${token}`)).rejects.toMatchObject({
      response: expect.objectContaining({
        statusCode: 401,
        error: expect.stringMatching(/INVALID_TOKEN|UNAUTHORIZED/),
      }),
    });
  });
});
