import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { MEDIA_TRANSCODE_QUEUE } from "../../messaging/media-transcode.constants";
import { MediaTranscodeTopologyService } from "../../messaging/media-transcode-topology.service";
import { transcodeQueueDepth } from "../../transcode-observability.metrics";

@Injectable()
export class MediaQueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaQueueMetricsService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly topology: MediaTranscodeTopologyService) {}

  public onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.sample();
    }, 15000);
  }

  public onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async sample(): Promise<void> {
    try {
      const channel = this.topology.getChannel();
      const stats = await channel.checkQueue(MEDIA_TRANSCODE_QUEUE);
      transcodeQueueDepth.set({ service: "transcode-worker" }, stats.messageCount);
    } catch (error) {
      this.logger.debug(
        `Queue metrics sample skipped: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    }
  }
}
