import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtVerificationService } from "./jwt-verification.service";
import { JwksService } from "./jwks.service";

describe("JwtVerificationService", () => {
  const jwt = new JwtVerificationService(
    {
      getOrThrow: (key: string) => (key === "JWT_ISSUER" ? "iss" : "aud"),
    } as ConfigService,
    {} as JwksService,
  );

  it("verifyRequired rejects missing bearer", async () => {
    await expect(jwt.verifyRequired(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("verifyBearer returns undefined without header", async () => {
    await expect(jwt.verifyBearer(undefined)).resolves.toBeUndefined();
  });
});
