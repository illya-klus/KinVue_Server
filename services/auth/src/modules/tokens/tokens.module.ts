import { Module } from "@nestjs/common";
import { TokensService } from "./tokens.service.js";
import { JwtModule } from "@nestjs/jwt";
import { RefreshSessionRepository } from "./refresh-session.repository.js";

@Module({
  imports: [JwtModule.register({})],
  providers: [TokensService, RefreshSessionRepository],
  exports: [TokensService],
})
export class TokensModule {}
