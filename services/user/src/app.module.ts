import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { usersConfigSchema, loadConfig } from "@kinvue/config";
import { HealthController, READINESS_CHECK } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { SharedLogger } from "./shared-logger";
import { SharedHttpErrorFilter } from "./errors.filters";
import { MongoModule } from "./mongo/mongo.module";
import { MongoService } from "./mongo/mongo.service";
import { EventsModule } from "./events/events.module";
import { UsersModule } from "./users/users.module";
import { FriendshipsModule } from "./friendships/friendships.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => loadConfig(usersConfigSchema, env),
    }),
    MongoModule,
    EventsModule,
    UsersModule,
    FriendshipsModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    { provide: READINESS_CHECK, useExisting: MongoService },
    SharedLogger,
    SharedHttpErrorFilter,
  ],
})
export class AppModule {}
