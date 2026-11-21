import { Controller, Get } from "@nestjs/common";
import { SigningKeyService } from "./signing-key.service.js";

@Controller(".well-known")
export class JwksController {
  public constructor(private readonly signingKey: SigningKeyService) {}

  @Get("jwks.json")
  public getJwks() {
    return this.signingKey.getJwks();
  }
}
