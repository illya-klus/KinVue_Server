import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { movieConfigSchema, loadConfig } from "@kinvue/config";
import { HealthController, READINESS_CHECK } from "./health.controller";
import { MoviePostgresReadiness } from "./readiness";
import { MetricsController, MetricsService } from "./metrics.controller";
import { SharedLogger } from "./shared-logger";
import { SharedHttpErrorFilter } from "./errors.filters";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(movieConfigSchema, env),
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    MoviePostgresReadiness,
    { provide: READINESS_CHECK, useExisting: MoviePostgresReadiness },
    MetricsService,
    SharedLogger,
    SharedHttpErrorFilter,
  ],
})
export class AppModule {}
