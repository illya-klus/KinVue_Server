import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RefreshSessionRepository } from "./refresh-session.repository.js";

export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

@Injectable()
export class TokensService {
  public constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly refreshSessions: RefreshSessionRepository,
  ) {}
  public verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
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
    const accessToken = await this.jwtService.signAsync(
      { sub, userId: sub, role, scopes },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: "15m",
        issuer: "kinvue-auth",
        audience: "kinvue",
      },
    );

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

    const user = await this.prisma.db.orm.public.AuthUser.first({
      id: session.userId,
    });
    if (!user) return null;
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: "15m",
      },
    );
    return { accessToken, refreshToken };
  }

  public revokeRefreshToken(token: string): Promise<void> {
    return this.refreshSessions.revoke(this.hashRefreshToken(token));
  }

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
