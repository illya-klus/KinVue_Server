import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type BeforeApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  NOTIFICATION_PUBLISHER,
  type NotificationPublisher,
} from "./notification-publisher";
import { OutboxRepository } from "./outbox.repository";
import { SharedLogger } from "../shared-logger";
import { usersNotificationPublishes } from "../users-observability.metrics";

@Injectable()
export class OutboxWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopped = false;

  constructor(
    private readonly config: ConfigService,
    private readonly repo: OutboxRepository,
    @Inject(NOTIFICATION_PUBLISHER)
    private readonly publisher: NotificationPublisher,
    private readonly logger: SharedLogger,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get<string>("RABBITMQ_URL")) this.schedule(0);
  }

  private schedule(delay: number) {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.running = this.publishPending()
        .catch((error: unknown) => {
          this.logger.warn("users outbox poll failed", {
            error: error instanceof Error ? error.name : "UnknownError",
          });
        })
        .finally(() => {
          this.running = undefined;
          this.schedule(2000);
        });
    }, delay);
    this.timer.unref();
  }

  async publishPending() {
    for (const event of await this.repo.pending()) {
      if (this.stopped) break;
      try {
        await this.publisher.publish(event);
        await this.repo.markPublished(event.eventId);
        usersNotificationPublishes.inc({
          type: event.type,
          outcome: "published",
        });
      } catch (error) {
        usersNotificationPublishes.inc({ type: event.type, outcome: "failed" });
        this.logger.warn("users outbox event stays pending", {
          eventId: event.eventId,
          type: event.type,
          error: error instanceof Error ? error.name : "UnknownError",
        });
        // Retry this batch on the next poll; avoid reconnecting for each row during an outage.
        break;
      }
    }
  }

  async beforeApplicationShutdown() {
    this.stopped = true;
    clearTimeout(this.timer);
    await this.running;
  }
}
