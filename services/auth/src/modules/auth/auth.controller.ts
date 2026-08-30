import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GrpcMethod, RpcException } from "@nestjs/microservices";
import {
  SignInWithGoogleRequest,
  SignInWithGoogleResponse,
} from "@kinvue/contracts";
import { status } from "@grpc/grpc-js";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "SignInWithGoogle")
  public signInWithGoogle(
    request: SignInWithGoogleRequest,
  ): SignInWithGoogleResponse {
    throw new RpcException({
      code: status.NOT_FOUND,
      message: "User not found",
    });

    return {
      accessToken: "fake-access-token",
      refreshToken: "fake-refresh-token",
      userAuthId: request.googleToken,
    };
  }
}
