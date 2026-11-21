import {
  Injectable,
  type BeforeApplicationShutdown,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SharedLogger } from "../shared-logger";
import { RoomInvitesRepository } from "./room-invites.repository";
import { RoomInvitesPublisher } from "./room-invites.publisher";

@Injectable()
export class RoomInvitesWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopped = false;

  constructor(
    private readonly config: ConfigService,
    private readonly repository: RoomInvitesRepository,
    private readonly publisher: RoomInvitesPublisher,
    private readonly logger: SharedLogger,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get<string>("RABBITMQ_URL")) this.schedule(0);
  }

  private schedule(delay: number) {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.running = this.repository
        .publishPending((event) => this.publisher.publish(event))
        .catch((error: unknown) => {
          this.logger.warn("rooms outbox poll failed", {
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

  async beforeApplicationShutdown() {
    this.stopped = true;
    clearTimeout(this.timer);
    await this.running;
  }
}
