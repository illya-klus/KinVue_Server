import { AuthServiceClient, SignInWithGoogleResponse } from "@kinvue/contracts";
import { Inject, Injectable } from "@nestjs/common";
import { type ClientGrpc } from "@nestjs/microservices";
import { Observable } from "rxjs";

@Injectable()
export class AuthService {
  private authClient: AuthServiceClient;

  constructor(
    @Inject("AUTH_PACKAGE")
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.authClient = this.client.getService<AuthServiceClient>("AuthService");
  }

  public signInWithGoogle(
    googleToken: string,
  ): Observable<SignInWithGoogleResponse> {
    return this.authClient.signInWithGoogle({
      googleToken,
    });
  }
}
