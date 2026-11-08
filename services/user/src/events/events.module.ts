import { Global, Module } from "@nestjs/common";
import { NOTIFICATION_PUBLISHER } from "./notification-publisher";
import { RabbitNotificationPublisher } from "./rabbit-notification.publisher";
import { SharedLogger } from "../shared-logger";

@Global()
@Module({
  providers: [
    SharedLogger,
    RabbitNotificationPublisher,
    {
      provide: NOTIFICATION_PUBLISHER,
      useExisting: RabbitNotificationPublisher,
    },
  ],
  exports: [NOTIFICATION_PUBLISHER],
})
export class EventsModule {}
