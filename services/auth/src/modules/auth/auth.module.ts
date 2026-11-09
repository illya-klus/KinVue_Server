import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";

import { JwtModule } from "@nestjs/jwt";
import { TokensModule } from "../tokens/tokens.module.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import { AuthIdentityRepository } from "./auth-identity.repository.js";

@Module({
  imports: [JwtModule, TokensModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, AuthIdentityRepository],
})
export class AuthModule {}
