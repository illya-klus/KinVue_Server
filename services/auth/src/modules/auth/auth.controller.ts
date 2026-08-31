import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { GrpcMethod, RpcException } from "@nestjs/microservices";
import {
  SignInWithGoogleRequest,
  SignInWithGoogleResponse,
} from "@kinvue/contracts";
import { TokensService } from "../tokens/tokens.service.js";
import { status } from "@grpc/grpc-js";

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
    //google-provided user data verification
    const googleUser = await this.authService.verifyGoogleToken(
      request.googleToken,
    );

    if (!googleUser.email)
      throw new RpcException({
        code: status.NOT_FOUND,
        message: "User email not found",
      });

    // create new user in database
    const user = await this.authService.createIfNotExists(
      "GOOGLE",
      request.googleToken,
      googleUser.email,
    );

    //access and refresh
    const { accessToken, refreshToken } =
      await this.tokensService.createTokenPair(
        user.id,
        user.role as "ADMIN" | "USER",
      );

    //compact-returning of result
    return {
      accessToken,
      refreshToken,
      userAuthId: googleUser.userId || "huina",
    };
  }
}
