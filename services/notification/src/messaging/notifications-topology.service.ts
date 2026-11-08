import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { type Channel } from "amqplib";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
import {
  NOTIFIER_DELIVERY_LIMIT,
  NOTIFIER_DLQ_QUEUE,
  NOTIFIER_DLQ_ROUTING_KEY,
  NOTIFIER_DLX_EXCHANGE,
  NOTIFIER_DOMAIN_EXCHANGE,
  NOTIFIER_MAIN_QUEUE,
  NOTIFIER_ROUTING_KEYS,
} from "./notifications-topology.constants";

@Injectable()
export class NotificationsTopologyService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsTopologyService.name);
  private connection: AmqpConnection | null = null;
  private channel: Channel | null = null;

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    await this.bootstrap();
  }

  public async bootstrap(): Promise<void> {
    const url = this.config.getOrThrow<string>("RABBITMQ_URL");
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    this.connection = connection;
    this.channel = channel;

    await channel.assertExchange(NOTIFIER_DOMAIN_EXCHANGE, "direct", {
      durable: true,
    });
    await channel.assertExchange(NOTIFIER_DLX_EXCHANGE, "direct", {
      durable: true,
    });

    await channel.assertQueue(NOTIFIER_DLQ_QUEUE, {
      durable: true,
    });
    await channel.bindQueue(
      NOTIFIER_DLQ_QUEUE,
      NOTIFIER_DLX_EXCHANGE,
      NOTIFIER_DLQ_ROUTING_KEY,
    );

    await channel.assertQueue(NOTIFIER_MAIN_QUEUE, {
      durable: true,
      arguments: {
        "x-queue-type": "quorum",
        "delivery-limit": NOTIFIER_DELIVERY_LIMIT,
        "x-dead-letter-exchange": NOTIFIER_DLX_EXCHANGE,
        "x-dead-letter-routing-key": NOTIFIER_DLQ_ROUTING_KEY,
      },
    });

    for (const routingKey of NOTIFIER_ROUTING_KEYS) {
      await channel.bindQueue(
        NOTIFIER_MAIN_QUEUE,
        NOTIFIER_DOMAIN_EXCHANGE,
        routingKey,
      );
    }

    this.logger.log(
      `RabbitMQ notifications topology ready (${NOTIFIER_MAIN_QUEUE}, ${NOTIFIER_DLQ_QUEUE})`,
    );
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("Notifications RabbitMQ channel is not ready");
    }
    return this.channel;
  }

  public async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }
}
