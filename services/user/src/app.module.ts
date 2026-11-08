import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { usersConfigSchema, loadConfig } from "@kinvue/config";
import { HealthController, READINESS_CHECK } from "./health.controller";
import { UsersMongoReadiness } from "./readiness";
import { MetricsController } from "./metrics.controller";
import { SharedLogger } from "./shared-logger";
import { SharedHttpErrorFilter } from "./errors.filters";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(usersConfigSchema, env),
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    UsersMongoReadiness,
    { provide: READINESS_CHECK, useExisting: UsersMongoReadiness },
    SharedLogger,
    SharedHttpErrorFilter,
  ],
})
export class AppModule {}
