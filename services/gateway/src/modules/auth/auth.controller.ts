import { Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  SignInWithGoogleRequest,
  SignInWithGoogleResponse,
} from "@kinvue/contracts";
import { Observable } from "rxjs";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/google")
  public register(
    request: SignInWithGoogleRequest,
  ): Observable<SignInWithGoogleResponse> {
    return this.authService.signInWithGoogle(request.googleToken);
  }
}
