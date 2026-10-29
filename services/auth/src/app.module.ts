import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ConfigModule } from "@nestjs/config";
import { TokensModule } from "./modules/tokens/tokens.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import {
  AUTH_READINESS_CHECK,
  AuthReadiness,
  HealthController,
} from "./health.controller.js";
import { PrismaService } from "./prisma/prisma.service.js";
import { SharedHttpErrorFilter } from "./shared-http-error.filter.js";
import { SharedLogger } from "./shared-logger.js";
import { MetricsController, MetricsService } from "./metrics.controller.js";
import { authConfigSchema, loadConfig } from "@kinvue/config";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(authConfigSchema, env),
    }),
    TokensModule,
  ],
  controllers: [AppController, HealthController, MetricsController],
  providers: [
    AppService,
    MetricsService,
    AuthReadiness,
    { provide: AUTH_READINESS_CHECK, useExisting: PrismaService },
    SharedLogger,
    SharedHttpErrorFilter,
  ],
})
export class AppModule {}
