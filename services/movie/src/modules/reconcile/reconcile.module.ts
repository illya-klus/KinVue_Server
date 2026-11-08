import { Module } from "@nestjs/common";
import { SearchModule } from "../search/search.module";
import { MovieReconcileScheduler } from "./movie-reconcile.scheduler";
import { MovieReconcileService } from "./movie-reconcile.service";

@Module({
  imports: [SearchModule],
  providers: [MovieReconcileService, MovieReconcileScheduler],
  exports: [MovieReconcileService],
})
export class ReconcileModule {}
