import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { type ConfirmChannel } from "amqplib";
import {
  notificationEventSchema,
  type NotificationEvent,
} from "@kinvue/contracts";
import type { RoomInvitedEvent } from "./room-invites.repository";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
const DOMAIN_EXCHANGE = "kinvue.domain";

@Injectable()
export class RoomInvitesPublisher implements OnApplicationShutdown {
  private connection: AmqpConnection | null = null;
  private channel: ConfirmChannel | null = null;
  private connecting: Promise<ConfirmChannel> | null = null;

  constructor(private readonly config: ConfigService) {}

  async publish(event: RoomInvitedEvent): Promise<void> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) throw new Error("RABBITMQ_URL not configured");
    const body = notificationEventSchema.parse(event) as NotificationEvent;
    const channel = await this.getChannel(url);
    await new Promise<void>((resolve, reject) => {
      const onReturn = (message: { properties: { messageId?: string } }) => {
        if (message.properties.messageId === body.eventId) {
          finish(new Error("Room invite event was unroutable"));
        }
      };
      const timer = setTimeout(
        () => finish(new Error("Broker confirmation timed out")),
        5000,
      );
      const finish = (error?: unknown) => {
        clearTimeout(timer);
        channel.off("return", onReturn);
        if (error) reject(error);
        else resolve();
      };
      channel.on("return", onReturn);
      try {
        channel.publish(
          DOMAIN_EXCHANGE,
          body.type,
          Buffer.from(JSON.stringify(body), "utf8"),
          {
            persistent: true,
            mandatory: true,
            contentType: "application/json",
            messageId: body.eventId,
            type: body.type,
            timestamp: Date.now(),
          },
          (error) => finish(error),
        );
      } catch (error) {
        finish(error);
      }
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
    const connection = await amqp.connect(url, { timeout: 5000 });
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
