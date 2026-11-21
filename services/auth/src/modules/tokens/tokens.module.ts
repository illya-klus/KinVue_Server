import { Module } from "@nestjs/common";
import { TokensService } from "./tokens.service.js";
import { JwtModule } from "@nestjs/jwt";
import { RefreshSessionRepository } from "./refresh-session.repository.js";
import { SigningKeyService } from "./signing-key.service.js";
import { JwksController } from "./jwks.controller.js";

@Module({
  imports: [JwtModule.register({})],
  controllers: [JwksController],
  providers: [TokensService, SigningKeyService, RefreshSessionRepository],
  exports: [TokensService, SigningKeyService],
})
export class TokensModule {}
