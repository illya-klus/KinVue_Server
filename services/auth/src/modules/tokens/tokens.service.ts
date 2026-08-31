import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokensService {
  public constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  public verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
    });
  }

  public verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
    });
  }

  public async createTokenPair(sub: string, role: "ADMIN" | "USER") {
    const accessToken = await this.jwtService.signAsync(
      { sub, role },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: "15m",
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub, role },
      {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      },
    );

    return { accessToken, refreshToken };
  }
}
