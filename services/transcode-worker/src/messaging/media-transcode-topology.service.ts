import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { type Channel } from "amqplib";
import { MEDIA_TRANSCODE_QUEUE } from "./media-transcode.constants";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

@Injectable()
export class MediaTranscodeTopologyService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MediaTranscodeTopologyService.name);
  private connection: AmqpConnection | null = null;
  private channel: Channel | null = null;

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    const url = this.config.getOrThrow<string>("RABBITMQ_URL");
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    this.connection = connection;
    this.channel = channel;
    await channel.assertQueue(MEDIA_TRANSCODE_QUEUE, {
      durable: true,
      arguments: { "x-queue-type": "quorum" },
    });
    this.logger.log(`RabbitMQ queue ready: ${MEDIA_TRANSCODE_QUEUE}`);
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("Transcode RabbitMQ channel is not ready");
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
