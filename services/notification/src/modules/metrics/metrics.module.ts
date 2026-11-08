import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { RabbitmqMetricsService } from "./rabbitmq-metrics.service";

@Module({
  controllers: [MetricsController],
  providers: [RabbitmqMetricsService],
})
export class MetricsModule {}
