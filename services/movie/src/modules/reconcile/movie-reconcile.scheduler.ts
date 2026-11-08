import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MovieReconcileService } from "./movie-reconcile.service";

@Injectable()
export class MovieReconcileScheduler {
  private readonly logger = new Logger(MovieReconcileScheduler.name);

  constructor(private readonly reconcile: MovieReconcileService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async incremental(): Promise<void> {
    try {
      await this.reconcile.runIncremental();
    } catch (error) {
      this.logger.warn(
        `Scheduled reconciliation failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
