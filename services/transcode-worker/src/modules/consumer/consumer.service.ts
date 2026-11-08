import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { ConsumeMessage } from "amqplib";
import {
  MEDIA_TRANSCODE_MAX_ATTEMPTS,
  MEDIA_TRANSCODE_QUEUE,
} from "../../messaging/media-transcode.constants";
import {
  mediaTranscodeJobSchema,
  type MediaTranscodeJob,
} from "../../messaging/media-transcode-job.schema";
import { MediaTranscodeTopologyService } from "../../messaging/media-transcode-topology.service";
import { MovieCallbackClient } from "../movie-callback/movie-callback.client";
import {
  transcodeDuration,
  transcodeJobs,
} from "../../transcode-observability.metrics";
import { HlsTranscodeService } from "../transcode/hls-transcode.service";

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsumerService.name);
  private consumerTag: string | null = null;
  private processing = false;

  constructor(
    private readonly topology: MediaTranscodeTopologyService,
    private readonly transcode: HlsTranscodeService,
    private readonly movie: MovieCallbackClient,
  ) {}

  public async onModuleInit(): Promise<void> {
    const channel = this.topology.getChannel();
    await channel.prefetch(1);
    const result = await channel.consume(
      MEDIA_TRANSCODE_QUEUE,
      (message) => {
        void this.handleMessage(message);
      },
      { noAck: false },
    );
    this.consumerTag = result.consumerTag;
    this.logger.log(`Consuming ${MEDIA_TRANSCODE_QUEUE} (one job at a time)`);
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
    if (!message || this.processing) {
      return;
    }
    this.processing = true;
    const channel = this.topology.getChannel();
    const started = process.hrtime.bigint();
    try {
      const job = this.parseJob(message);
      const masterKey = await this.transcode.transcode(job);
      await this.movie.transcodeComplete(job.movieId, masterKey);
      transcodeJobs.inc({ outcome: "success" });
      transcodeDuration.observe(
        { outcome: "success" },
        Number(process.hrtime.bigint() - started) / 1e9,
      );
      channel.ack(message);
    } catch (error: unknown) {
      const job = this.safeParseJob(message);
      if (!job) {
        channel.ack(message);
        return;
      }
      if (job.attempt >= MEDIA_TRANSCODE_MAX_ATTEMPTS) {
        await this.movie.transcodeFailed(job.movieId);
        transcodeJobs.inc({ outcome: "failed" });
        transcodeDuration.observe(
          { outcome: "failed" },
          Number(process.hrtime.bigint() - started) / 1e9,
        );
        channel.ack(message);
        return;
      }
      channel.publish(
        "",
        MEDIA_TRANSCODE_QUEUE,
        Buffer.from(
          JSON.stringify({
            ...job,
            attempt: job.attempt + 1,
          }),
        ),
        { persistent: true },
      );
      channel.ack(message);
      this.logger.warn(
        `transcode failed attempt ${job.attempt}, requeued: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    } finally {
      this.processing = false;
    }
  }

  private parseJob(message: ConsumeMessage): MediaTranscodeJob {
    const raw = JSON.parse(message.content.toString("utf8")) as unknown;
    const job = mediaTranscodeJobSchema.parse(raw);
    if (job.attempt > MEDIA_TRANSCODE_MAX_ATTEMPTS) {
      throw new Error("attempt exceeds max");
    }
    return job;
  }

  private safeParseJob(message: ConsumeMessage): MediaTranscodeJob | null {
    try {
      return this.parseJob(message);
    } catch {
      return null;
    }
  }
}
