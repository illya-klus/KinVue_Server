import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RefreshSessionRepository } from "./refresh-session.repository.js";
import { SigningKeyService } from "./signing-key.service.js";

export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_ACCESS_TOKEN_ISSUER = "kinvue-auth";
export const AUTH_ACCESS_TOKEN_AUDIENCE = "kinvue";
export const AUTH_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class TokensService {
  public constructor(
    // Key material is owned and validated by SigningKeyService.
    _config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly signingKey: SigningKeyService,
    private readonly prisma: PrismaService,
    private readonly refreshSessions: RefreshSessionRepository,
  ) {}

  public verifyAccessToken(token: string): Promise<Record<string, unknown>> {
    return this.jwtService.verifyAsync(token, {
      publicKey: this.signingKey.getPublicKey(),
      algorithms: ["RS256"],
      issuer: AUTH_ACCESS_TOKEN_ISSUER,
      audience: AUTH_ACCESS_TOKEN_AUDIENCE,
    });
  }

  public async verifyRefreshToken(token: string) {
    const tokenHash = this.hashRefreshToken(token);
    const session = await this.prisma.db.orm.public.RefreshSession.first({
      tokenHash,
    });
    if (
      !session ||
      session.revokedAt ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      return null;
    }
    return { sub: session.userId, sessionId: session.id };
  }

  public async createTokenPair(sub: string, role: "ADMIN" | "USER") {
    const scopes = role === "ADMIN" ? ["admin"] : [];
    const accessToken = await this.createAccessToken(sub, scopes);

    const refreshToken = randomBytes(32).toString("base64url");
    const now = new Date();
    await this.prisma.db.orm.public.RefreshSession.create({
      id: randomUUID(),
      userId: sub,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(
        now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000,
      ).toISOString(),
      revokedAt: null,
      rotatedFromSessionId: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return { accessToken, refreshToken };
  }

  public async rotateRefreshToken(token: string) {
    const refreshToken = randomBytes(32).toString("base64url");
    const session = await this.refreshSessions.rotate(
      this.hashRefreshToken(token),
      this.hashRefreshToken(refreshToken),
    );
    if (!session) return null;

    const identity = await this.prisma.db.orm.public.AuthIdentity.first({
      userId: session.userId,
    });
    if (identity && identity.status !== "ACTIVE") return null;

    const user = await this.prisma.db.orm.public.AuthUser.first({
      id: session.userId,
    });
    // Password identities are kept separately from legacy Google AuthUser
    // rows. Active password users without a role row remain ordinary users.
    if (!identity && !user) return null;

    const scopes = user?.role === "ADMIN" ? ["admin"] : [];
    const accessToken = await this.createAccessToken(session.userId, scopes);
    return { accessToken, refreshToken };
  }

  public revokeRefreshToken(token: string): Promise<void> {
    return this.refreshSessions.revoke(this.hashRefreshToken(token));
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

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
