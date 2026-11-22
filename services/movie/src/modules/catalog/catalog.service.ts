import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  MoviesRepository,
  type MovieMetadata,
} from "../../database/movies.repository";
import type { MovieRow } from "../../database/database.service";
import { MovieSearchIndexService } from "../search/movie-search-index.service";
import { movieView } from "./movie-view";

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  constructor(
    private readonly movies: MoviesRepository,
    private readonly index: MovieSearchIndexService,
  ) {}
  async create(input: MovieMetadata, userId: string) {
    return movieView(await this.movies.create(input, userId));
  }
  async adminGet(id: string) {
    return movieView(await this.requireMovie(id));
  }
  async publicGet(id: string) {
    const movie = await this.movies.findPublishedById(id);
    if (!movie) throw new NotFoundException("Movie not found");
    return movieView(movie);
  }
  async update(id: string, input: Partial<MovieMetadata>) {
    const movie = await this.movies.update(id, input);
    if (!movie) {
      await this.requireMovie(id);
      throw new ConflictException("Abandoned movie cannot be edited");
    }
    // Published metadata is durable before the best-effort index update too.
    if (movie.status === "PUBLISHED") return this.indexSaved(movie);
    return movieView(movie);
  }
  async publish(id: string) {
    const movie = await this.movies.publish(id);
    if (movie) return this.indexSaved(movie);
    const existing = await this.requireMovie(id);
    // Safe retries can repair indexing without another state transition.
    if (existing.status === "PUBLISHED") return this.indexSaved(existing);
    throw new ConflictException(
      "Publication requires READY media and a draft or due schedule",
    );
  }
  async schedule(id: string, publishAt: string) {
    const at = new Date(publishAt);
    if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now())
      throw new BadRequestException("publishAt must be in the future");
    const movie = await this.movies.schedule(id, at);
    if (!movie) {
      await this.requireMovie(id);
      throw new ConflictException(
        "Only drafts and scheduled, non-abandoned movies can be scheduled for a future time",
      );
    }
    return movieView(movie);
  }
  async publishDue() {
    const due = await this.movies.findDue();
    for (const movie of due) {
      try {
        await this.publish(movie.id);
      } catch {
        this.logger.warn(
          `Scheduled publication failed for ${movie.id}; it can be retried`,
        );
      }
    }
  }
  private async requireMovie(id: string) {
    const movie = await this.movies.findById(id);
    if (!movie) throw new NotFoundException("Movie not found");
    return movie;
  }
  private async indexSaved(movie: MovieRow) {
    let searchIndex: "QUEUED" | "PENDING" = "QUEUED";
    try {
      await this.index.upsertPublishedMovie(movie);
    } catch {
      searchIndex = "PENDING";
      this.logger.warn(
        `Catalog saved for ${movie.id}; reconciliation will retry indexing`,
      );
    }
    return {
      ...movieView(movie),
      catalogSaved: true,
      searchIndex,
      message:
        searchIndex === "PENDING"
          ? "Catalog saved. Search index will catch up."
          : "Catalog saved. Search indexing queued.",
    };
  }
}
