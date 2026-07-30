import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GrpcMethod } from "@nestjs/microservices";
import {
  SignInWithGoogleRequest,
  SignInWithGoogleResponse,
} from "../../../../../packages/shared-protos/dist";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "SignInWithGoogle")
  public signInWithGoogle(
    request: SignInWithGoogleRequest,
  ): SignInWithGoogleResponse {
    console.log(request.googleToken);
    return {
      accessToken: "fake-access-token",
      refreshToken: "fake-refresh-token",
      userAuthId: "fake-user-id",
    };
  }
}
