import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { roomsConfigSchema, loadConfig } from "@kinvue/config";
import {
  HealthController,
  REDIS_READINESS,
  RoomsRedisReadiness,
} from "./health.controller";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";
import { MetricsController, MetricsService } from "./metrics.controller";
import { WebSocketReservation } from "./websocket-reservation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(roomsConfigSchema, env),
    }),
  ],
  controllers: [AppController, HealthController, MetricsController],
  providers: [
    AppService,
    MetricsService,
    SharedLogger,
    SharedHttpErrorFilter,
    WebSocketReservation,
    RoomsRedisReadiness,
    {
      provide: REDIS_READINESS,
      useExisting: RoomsRedisReadiness,
    },
  ],
})
export class AppModule {}
