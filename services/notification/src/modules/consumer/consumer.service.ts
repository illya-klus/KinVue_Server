import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  notificationEventSchema,
  type NotificationEvent,
} from "@kinvue/contracts";
import type { ConsumeMessage } from "amqplib";
import { NOTIFIER_MAIN_QUEUE } from "../../messaging/notifications-topology.constants";
import { NotificationsTopologyService } from "../../messaging/notifications-topology.service";
import { NotificationsRepository } from "../../database/notifications.repository";
import { FakePushProvider } from "./fake-push.provider";

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsumerService.name);
  private consumerTag: string | null = null;

  constructor(
    private readonly topology: NotificationsTopologyService,
    private readonly notifications: NotificationsRepository,
    private readonly push: FakePushProvider,
  ) {}

  public async onModuleInit(): Promise<void> {
    const channel = this.topology.getChannel();
    await channel.prefetch(1);
    const result = await channel.consume(
      NOTIFIER_MAIN_QUEUE,
      (message) => {
        void this.handleMessage(message);
      },
      { noAck: false },
    );
    this.consumerTag = result.consumerTag;
    this.logger.log(`Consuming ${NOTIFIER_MAIN_QUEUE} with manual ACK`);
  }

  public async onModuleDestroy(): Promise<void> {
    if (!this.consumerTag) {
      return;
    }
    const channel = this.topology.getChannel();
    await channel.cancel(this.consumerTag);
    this.consumerTag = null;
  }

  private async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }
    const channel = this.topology.getChannel();
    try {
      const event = this.parseEvent(message);
      const outcome =
        await this.notifications.insertNotificationIfNewEvent(event);
      if (outcome === "created") {
        this.push.deliverInApp(event);
      }
      channel.ack(message);
    } catch (error: unknown) {
      this.logger.warn(
        `Notification consume failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
      channel.nack(message, false, false);
    }
  }

  private parseEvent(message: ConsumeMessage): NotificationEvent {
    const raw = JSON.parse(message.content.toString("utf8")) as unknown;
    return notificationEventSchema.parse(raw);
  }
}
