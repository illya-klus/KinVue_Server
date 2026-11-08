import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type NotificationEvent,
  notificationEventSchema,
} from "@kinvue/contracts";
import amqp, { type ConfirmChannel } from "amqplib";
import { SharedLogger } from "../shared-logger";
import {
  DOMAIN_EXCHANGE,
  type NotificationPublisher,
} from "./notification-publisher";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

/**
 * Publishes validated notification events to `kinvue.domain` with publisher
 * confirms. Connects lazily and reconnects after a drop; when RABBITMQ_URL is
 * not configured it is a logged no-op so local dev works without a broker.
 */
@Injectable()
export class RabbitNotificationPublisher
  implements NotificationPublisher, OnApplicationShutdown
{
  private connection: AmqpConnection | null = null;
  private channel: ConfirmChannel | null = null;
  private connecting: Promise<ConfirmChannel> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: SharedLogger,
  ) {}

  async publish(event: NotificationEvent): Promise<void> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      this.logger.warn("RABBITMQ_URL not set; notification event skipped", {
        type: event.type,
        eventId: event.eventId,
      });
      return;
    }
    const body = notificationEventSchema.parse(event);
    const channel = await this.getChannel(url);
    await new Promise<void>((resolve, reject) => {
      channel.publish(
        DOMAIN_EXCHANGE,
        body.type,
        Buffer.from(JSON.stringify(body), "utf8"),
        {
          persistent: true,
          contentType: "application/json",
          messageId: body.eventId,
          type: body.type,
          timestamp: Date.now(),
        },
        (error) => (error ? reject(error) : resolve()),
      );
    });
  }

  private getChannel(url: string): Promise<ConfirmChannel> {
    if (this.channel) return Promise.resolve(this.channel);
    this.connecting ??= this.connect(url).finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async connect(url: string): Promise<ConfirmChannel> {
    const connection = await amqp.connect(url);
    const reset = () => {
      if (this.connection === connection) {
        this.connection = null;
        this.channel = null;
      }
    };
    connection.on("error", reset);
    connection.on("close", reset);
    try {
      const channel = await connection.createConfirmChannel();
      channel.on("error", reset);
      channel.on("close", reset);
      await channel.assertExchange(DOMAIN_EXCHANGE, "direct", {
        durable: true,
      });
      this.connection = connection;
      this.channel = channel;
      return channel;
    } catch (error) {
      await connection.close().catch(() => undefined);
      throw error;
    }
  }

  async onApplicationShutdown() {
    const connection = this.connection;
    this.channel = null;
    this.connection = null;
    await connection?.close().catch(() => undefined);
  }
}
