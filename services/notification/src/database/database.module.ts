import { Global, Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { NotificationsRepository } from "./notifications.repository";

@Global()
@Module({
  providers: [DatabaseService, NotificationsRepository],
  exports: [DatabaseService, NotificationsRepository],
})
export class DatabaseModule {}
