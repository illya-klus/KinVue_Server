import { Module } from "@nestjs/common";
import { MeilisearchModule } from "../meilisearch/meilisearch.module";
import { MovieSearchIndexService } from "./movie-search-index.service";
import { MoviesSearchController } from "./movies-search.controller";
import { MoviesSearchService } from "./movies-search.service";

@Module({
  imports: [MeilisearchModule],
  controllers: [MoviesSearchController],
  providers: [MoviesSearchService, MovieSearchIndexService],
  exports: [MovieSearchIndexService, MoviesSearchService],
})
export class SearchModule {}
