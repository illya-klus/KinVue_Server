import { Injectable, Logger } from "@nestjs/common";
import { MoviesRepository } from "../../database/movies.repository";
import { SyncStateRepository } from "../../database/sync-state.repository";
import { MovieSearchIndexService } from "../search/movie-search-index.service";
import { reconcileWindow } from "./reconcile-window";

@Injectable()
export class MovieReconcileService {
  private readonly logger = new Logger(MovieReconcileService.name);

  constructor(
    private readonly movies: MoviesRepository,
    private readonly syncState: SyncStateRepository,
    private readonly indexer: MovieSearchIndexService,
  ) {}

  public async runIncremental(jobStartedAt = new Date()): Promise<void> {
    const last = await this.syncState.getLastSuccessfulSync();
    const { from, to } = reconcileWindow(jobStartedAt, last);

    const batch = await this.movies.listPublishedUpdatedBetween(from, to);
    if (batch.length === 0) {
      await this.syncState.setLastSuccessfulSync(jobStartedAt);
      return;
    }

    try {
      for (const movie of batch) {
        await this.indexer.upsertPublishedMovie(movie);
      }
      await this.syncState.setLastSuccessfulSync(jobStartedAt);
      this.logger.log(
        `Reconciliation upserted ${batch.length} movies (${from.toISOString()} .. ${to.toISOString()})`,
      );
    } catch (error) {
      this.logger.error("Reconciliation failed; checkpoint unchanged", error);
      throw error;
    }
  }

  public async rebuildFullIndex(): Promise<number> {
    const published = await this.movies.listAllPublished();
    for (const movie of published) {
      await this.indexer.upsertPublishedMovie(movie);
    }
    await this.syncState.setLastSuccessfulSync(new Date());
    return published.length;
  }
}
