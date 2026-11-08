import { Controller } from "@nestjs/common";
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
