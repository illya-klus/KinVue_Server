import { Global, Module } from "@nestjs/common";
import { NOTIFICATION_PUBLISHER } from "./notification-publisher";
import { RabbitNotificationPublisher } from "./rabbit-notification.publisher";
import { SharedLogger } from "../shared-logger";
import { OutboxRepository } from "./outbox.repository";
import { OutboxWorker } from "./outbox.worker";

@Global()
@Module({
  providers: [
    SharedLogger,
    RabbitNotificationPublisher,
    OutboxRepository,
    OutboxWorker,
    {
      provide: NOTIFICATION_PUBLISHER,
      useExisting: RabbitNotificationPublisher,
    },
  ],
  exports: [OutboxRepository],
})
export class EventsModule {}
