import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { type ConfirmChannel } from "amqplib";
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
  private channel: ConfirmChannel | null = null;
  private connecting: Promise<ConfirmChannel> | null = null;

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
    const channel = await this.getConfirmChannel(url);
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    await new Promise<void>((resolve, reject) => {
      channel.sendToQueue(
        MEDIA_TRANSCODE_QUEUE,
        body,
        {
          persistent: true,
          contentType: "application/json",
          messageId: payload.jobId,
        },
        (error) => (error ? reject(error) : resolve()),
      );
    });
    this.logger.log("Transcode job enqueued", {
      jobId: payload.jobId,
      movieId: payload.movieId,
    });
  }

  private getConfirmChannel(url: string): Promise<ConfirmChannel> {
    if (this.channel) {
      return Promise.resolve(this.channel);
    }
    this.connecting ??= this.connect(url).finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async connect(url: string): Promise<ConfirmChannel> {
    const connection = await amqp.connect(url);
    const channel = await connection.createConfirmChannel();
    await channel.assertQueue(MEDIA_TRANSCODE_QUEUE, {
      durable: true,
      arguments: { "x-queue-type": "quorum" },
    });
    connection.on("error", () => {
      this.channel = null;
    });
    connection.on("close", () => {
      this.channel = null;
      this.connection = null;
    });
    channel.on("error", () => {
      this.channel = null;
    });
    channel.on("close", () => {
      this.channel = null;
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
