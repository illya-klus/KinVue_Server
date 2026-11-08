import { Injectable, Logger } from "@nestjs/common";
import { MoviesRepository } from "../../database/movies.repository";
import type { MovieRow } from "../../database/database.service";
import { MeilisearchClient } from "../meilisearch/meilisearch.client";
import { MOVIES_INDEX } from "../meilisearch/meilisearch.constants";
import { toSearchDocument } from "./movie-search-document";

@Injectable()
export class MovieSearchIndexService {
  private readonly logger = new Logger(MovieSearchIndexService.name);

  constructor(
    private readonly meili: MeilisearchClient,
    private readonly movies: MoviesRepository,
  ) {}

  public async upsertPublishedMovie(movie: MovieRow): Promise<void> {
    if (movie.status !== "PUBLISHED") {
      return;
    }

    const index = this.meili.index(MOVIES_INDEX);
    const doc = toSearchDocument(movie);
    await index.addDocuments([doc], { primaryKey: "id" });
    this.logger.debug(`Upserted movie ${movie.id} into Meilisearch`);
  }

  public async upsertPublishedMovieById(movieId: string): Promise<void> {
    const movie = await this.movies.findById(movieId);
    if (!movie || movie.status !== "PUBLISHED") {
      if (movie) {
        await this.deleteMovie(movieId);
      }
      return;
    }
    await this.upsertPublishedMovie(movie);
  }

  public async deleteMovie(movieId: string): Promise<void> {
    await this.meili.index(MOVIES_INDEX).deleteDocument(movieId);
  }
}
