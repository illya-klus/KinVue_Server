import { Module } from "@nestjs/common";
import { MediaQueueMetricsService } from "./media-queue-metrics.service";
import { MetricsController } from "./metrics.controller";

@Module({
  controllers: [MetricsController],
  providers: [MediaQueueMetricsService],
})
export class MetricsModule {}
