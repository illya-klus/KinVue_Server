import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { decodeProtectedHeader, errors, jwtVerify } from "jose";
import { JwksService } from "./jwks.service";
import type { VerifiedToken } from "./proxy.types";

@Injectable()
export class JwtVerificationService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwks: JwksService,
  ) {}

  public async verifyBearer(
    authorization?: string,
  ): Promise<VerifiedToken | undefined> {
    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      return undefined;
    }

    try {
      return await this.verifyToken(token);
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: "TOKEN_EXPIRED",
          message: "Access token expired.",
        });
      }
      if (error instanceof errors.JWTInvalid) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: "INVALID_TOKEN",
          message: "Access token is invalid.",
        });
      }
      throw new UnauthorizedException({
        statusCode: 401,
        error: "INVALID_TOKEN",
        message: "Access token verification failed.",
      });
    }
  }

  public async verifyRequired(authorization?: string): Promise<VerifiedToken> {
    const verified = await this.verifyBearer(authorization);
    if (!verified) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: "UNAUTHORIZED",
        message: "Bearer token required.",
      });
    }
    return verified;
  }

  private async verifyToken(token: string): Promise<VerifiedToken> {
    const header = decodeProtectedHeader(token);
    if (!header.kid) {
      throw new errors.JWTInvalid("Token header missing kid.");
    }

    const key = await this.jwks.getKey(header.kid);
    const issuer = this.config.getOrThrow<string>("JWT_ISSUER");
    const audience = this.config.getOrThrow<string>("JWT_AUDIENCE");

    const { payload } = await jwtVerify(token, key, { issuer, audience });

    const userId =
      (typeof payload.userId === "string" && payload.userId) ||
      (typeof payload.sub === "string" && payload.sub);

    if (!userId) {
      throw new errors.JWTInvalid("Token missing userId/sub.");
    }

    let scopes: string[] = [];
    if (Array.isArray(payload.scopes)) {
      scopes = payload.scopes.filter((s): s is string => typeof s === "string");
    } else if (typeof payload.scope === "string") {
      scopes = payload.scope.split(/\s+/).filter(Boolean);
    }

    return { userId, scopes };
  }
}
