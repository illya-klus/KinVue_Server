import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { loadConfig, movieConfigSchema } from "@kinvue/config";
import { DatabaseModule } from "./database/database.module";
import { SharedHttpErrorFilter } from "./errors.filters";
import { HealthController, READINESS_CHECK } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { MeilisearchModule } from "./modules/meilisearch/meilisearch.module";
import { ReconcileModule } from "./modules/reconcile/reconcile.module";
import { InternalModule } from "./modules/internal/internal.module";
import { SearchModule } from "./modules/search/search.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { MoviePostgresReadiness } from "./readiness";
import { SharedLogger } from "./shared-logger";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(movieConfigSchema, env),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    MeilisearchModule,
    SearchModule,
    ReconcileModule,
    InternalModule,
    UploadsModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    MoviePostgresReadiness,
    { provide: READINESS_CHECK, useExisting: MoviePostgresReadiness },
    SharedLogger,
    SharedHttpErrorFilter,
  ],
})
export class AppModule {}
