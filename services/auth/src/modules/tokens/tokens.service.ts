import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { SigningKeyService } from "./signing-key.service.js";

export const AUTH_ACCESS_TOKEN_ISSUER = "kinvue-auth";
export const AUTH_ACCESS_TOKEN_AUDIENCE = "kinvue";
export const AUTH_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class TokensService {
  public constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly signingKey: SigningKeyService,
  ) {}
  public verifyAccessToken(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verifyAsync(token, {
      publicKey: this.signingKey.getPublicKey(),
      algorithms: ["RS256"],
      issuer: AUTH_ACCESS_TOKEN_ISSUER,
      audience: AUTH_ACCESS_TOKEN_AUDIENCE,
    });
  }

  public verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
    });
  }

  public async createTokenPair(sub: string, role: "ADMIN" | "USER") {
    const scopes = role === "ADMIN" ? ["admin"] : [];
    const accessToken = await this.createAccessToken(sub, scopes);

    const refreshToken = await this.jwtService.signAsync(
      { sub, role },
      {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      },
    );

    return { accessToken, refreshToken };
  }

  public createAccessToken(
    userId: string,
    scopes: readonly string[],
  ): Promise<string> {
    return this.jwtService.signAsync(
      { userId, scopes: [...new Set(scopes)] },
      {
        privateKey: this.signingKey.getPrivateKey(),
        algorithm: "RS256",
        keyid: this.signingKey.getKeyId(),
        issuer: AUTH_ACCESS_TOKEN_ISSUER,
        audience: AUTH_ACCESS_TOKEN_AUDIENCE,
        subject: userId,
        expiresIn: AUTH_ACCESS_TOKEN_TTL_SECONDS,
      },
    );
  }
}
