import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { roomsConfigSchema, loadConfig } from "@kinvue/config";
import {
  HealthController,
  REDIS_READINESS,
  RoomsRedisReadiness,
  ROOMS_REDIS,
} from "./health.controller";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";
import { MetricsController } from "./metrics.controller";
import { WebSocketReservation } from "./websocket-reservation";
import { RoomsService } from "./rooms.service";
import { RoomsDatabaseService } from "./database/rooms-database.service";
import { ROOMS_DATABASE_READINESS } from "./health.controller";
import { RoomInvitesRepository } from "./invites/room-invites.repository";
import { RoomInvitesPublisher } from "./invites/room-invites.publisher";
import { RoomInvitesWorker } from "./invites/room-invites.worker";
import { ScheduledRoomsRepository } from "./scheduled-rooms/scheduled-rooms.repository";
import { ScheduledRoomsService } from "./scheduled-rooms/scheduled-rooms.service";

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
    RoomsService,
    RoomsDatabaseService,
    RoomInvitesRepository,
    RoomInvitesPublisher,
    RoomInvitesWorker,
    ScheduledRoomsRepository,
    ScheduledRoomsService,
    SharedLogger,
    SharedHttpErrorFilter,
    WebSocketReservation,
    RoomsRedisReadiness,
    {
      provide: REDIS_READINESS,
      useExisting: RoomsRedisReadiness,
    },
    {
      provide: ROOMS_REDIS,
      useFactory: (readiness: RoomsRedisReadiness) => readiness.client,
      inject: [RoomsRedisReadiness],
    },
    {
      provide: ROOMS_DATABASE_READINESS,
      useExisting: RoomsDatabaseService,
    },
  ],
})
export class AppModule {}
