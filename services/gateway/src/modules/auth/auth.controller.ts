import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInWithGoogleResponse } from "@kinvue/contracts";
import { Observable } from "rxjs";
import { SignInWithGoogleDto } from "./dtos/sign-in-with-google.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/google")
  public register(
    @Body() request: SignInWithGoogleDto,
  ): Observable<SignInWithGoogleResponse> {
    return this.authService.signInWithGoogle(request.googleToken);
  }
}
