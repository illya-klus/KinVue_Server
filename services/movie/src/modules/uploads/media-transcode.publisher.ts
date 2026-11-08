import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { type Channel } from "amqplib";
import { MEDIA_TRANSCODE_QUEUE } from "./media-transcode.constants";
import {
  type MediaTranscodeJob,
  mediaTranscodeJobSchema,
} from "./media-transcode-job.schema";
import { AppError } from "@kinvue/errors";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

@Injectable()
export class MediaTranscodePublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(MediaTranscodePublisher.name);
  private connection: AmqpConnection | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<Channel> | null = null;

  constructor(private readonly config: ConfigService) {}

  public async publish(job: MediaTranscodeJob): Promise<void> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      throw new AppError(
        "UPSTREAM_UNAVAILABLE",
        "RabbitMQ is not configured for transcode enqueue",
      );
    }
    const payload = mediaTranscodeJobSchema.parse(job);
    const channel = await this.getChannel(url);
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    const sent = channel.sendToQueue(MEDIA_TRANSCODE_QUEUE, body, {
      persistent: true,
      contentType: "application/json",
    });
    if (!sent) {
      throw new AppError(
        "UPSTREAM_UNAVAILABLE",
        "Failed to enqueue transcode job",
      );
    }
    this.logger.log("Transcode job enqueued", {
      jobId: payload.jobId,
      movieId: payload.movieId,
    });
  }

  private getChannel(url: string): Promise<Channel> {
    if (this.channel) {
      return Promise.resolve(this.channel);
    }
    this.connecting ??= this.connect(url).finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async connect(url: string): Promise<Channel> {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(MEDIA_TRANSCODE_QUEUE, {
      durable: true,
      arguments: { "x-queue-type": "quorum" },
    });
    this.connection = connection;
    this.channel = channel;
    return channel;
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = null;
    this.connection = null;
  }
}
