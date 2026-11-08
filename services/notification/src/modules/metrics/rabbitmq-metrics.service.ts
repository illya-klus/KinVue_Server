import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { getGauge } from "@kinvue/http-metrics";
import {
  NOTIFIER_DLQ_QUEUE,
  NOTIFIER_MAIN_QUEUE,
} from "../../messaging/notifications-topology.constants";
import { NotificationsTopologyService } from "../../messaging/notifications-topology.service";

const queueDepth = getGauge(
  "rabbitmq_queue_depth",
  "RabbitMQ queue message depth",
  ["queue", "service"],
);

@Injectable()
export class RabbitmqMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqMetricsService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly topology: NotificationsTopologyService) {}

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
      const [main, dlq] = await Promise.all([
        channel.checkQueue(NOTIFIER_MAIN_QUEUE),
        channel.checkQueue(NOTIFIER_DLQ_QUEUE),
      ]);
      queueDepth.set(
        { queue: NOTIFIER_MAIN_QUEUE, service: "notification" },
        main.messageCount,
      );
      queueDepth.set(
        { queue: NOTIFIER_DLQ_QUEUE, service: "notification" },
        dlq.messageCount,
      );
    } catch (error) {
      this.logger.debug(
        `RabbitMQ metrics sample skipped: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    }
  }
}
