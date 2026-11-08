import { Global, Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { MoviesRepository } from "./movies.repository";
import { SyncStateRepository } from "./sync-state.repository";

@Global()
@Module({
  providers: [DatabaseService, MoviesRepository, SyncStateRepository],
  exports: [DatabaseService, MoviesRepository, SyncStateRepository],
})
export class DatabaseModule {}
