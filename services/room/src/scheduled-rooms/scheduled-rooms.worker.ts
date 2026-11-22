import {
  Injectable,
  type BeforeApplicationShutdown,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { SharedLogger } from "../shared-logger";
import { RoomsService } from "../rooms.service";
import { ScheduledRoomsRepository } from "./scheduled-rooms.repository";

@Injectable()
export class ScheduledRoomsWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopped = false;

  constructor(
    private readonly repository: ScheduledRoomsRepository,
    private readonly rooms: RoomsService,
    private readonly logger: SharedLogger,
  ) {}

  onApplicationBootstrap() {
    this.schedule(0);
  }

  private schedule(delay: number) {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.running = this.repository
        .openDue(async (schedule) => {
          await this.rooms.openScheduledRoom({
            roomId: schedule.roomId,
            movieId: schedule.movieId,
            visibility: schedule.visibility,
            ownerId: schedule.ownerId,
          });
        })
        .then(() => undefined)
        .catch((error: unknown) => {
          this.logger.warn("scheduled rooms poll failed", {
            error: error instanceof Error ? error.name : "UnknownError",
          });
        })
        .finally(() => {
          this.running = undefined;
          this.schedule(1000);
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
