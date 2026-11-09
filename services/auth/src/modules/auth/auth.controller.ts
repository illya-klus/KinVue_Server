import {
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { GrpcMethod, RpcException } from "@nestjs/microservices";
import {
  SignInWithGoogleRequest,
  SignInWithGoogleResponse,
} from "@kinvue/contracts";
import { TokensService } from "../tokens/tokens.service.js";
import { status } from "@grpc/grpc-js";
import {
  authLoginAttempts,
  authRegistrationAttempts,
} from "../../auth-observability.metrics.js";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService,
  ) {}

  @Post("auth/refresh")
  public async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.readRefreshCookie(request.headers.cookie);
    if (!refreshToken) throw new UnauthorizedException();
    const tokens = await this.tokensService.rotateRefreshToken(refreshToken);
    if (!tokens) throw new UnauthorizedException();

    response.cookie("kinvue_refresh", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      path: "/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Post("auth/logout")
  @HttpCode(204)
  public async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.readRefreshCookie(request.headers.cookie);
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken);
    }
    response.clearCookie("kinvue_refresh", {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      path: "/auth/refresh",
    });
  }

  private readRefreshCookie(cookieHeader?: string): string | null {
    const value = cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("kinvue_refresh="))
      ?.slice("kinvue_refresh=".length);
    return value ? decodeURIComponent(value) : null;
  }

  @GrpcMethod("AuthService", "SignInWithGoogle")
  public async signInWithGoogle(
    request: SignInWithGoogleRequest,
  ): Promise<SignInWithGoogleResponse> {
    try {
      return await this.signInWithGoogleInner(request);
    } catch (error) {
      authLoginAttempts.inc({ outcome: "failure" });
      throw error;
    }
  }

  private async signInWithGoogleInner(
    request: SignInWithGoogleRequest,
  ): Promise<SignInWithGoogleResponse> {
    const googleUser = await this.authService.verifyGoogleToken(
      request.googleToken,
    );

    if (!googleUser.email) {
      authLoginAttempts.inc({ outcome: "failure" });
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "User email not found",
      });
    }

    const { user, created } = await this.authService.createIfNotExists(
      "GOOGLE",
      request.googleToken,
      googleUser.email,
    );
    authRegistrationAttempts.inc({
      outcome: created ? "success" : "existing",
    });

    const { accessToken, refreshToken } =
      await this.tokensService.createTokenPair(
        user.id,
        user.role as "ADMIN" | "USER",
      );

    //compact-returning of result
    authLoginAttempts.inc({ outcome: "success" });
    return {
      accessToken,
      refreshToken,
      userAuthId: googleUser.userId || "huina",
    };
  }
}
