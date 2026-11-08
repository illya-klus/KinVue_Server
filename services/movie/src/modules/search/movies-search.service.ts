import { Injectable } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import { MeilisearchClient } from "../meilisearch/meilisearch.client";
import { MOVIES_INDEX } from "../meilisearch/meilisearch.constants";
import type { SearchQueryDto } from "./search-query.dto";

@Injectable()
export class MoviesSearchService {
  constructor(private readonly meili: MeilisearchClient) {}

  public async search(dto: SearchQueryDto) {
    const filters = ['publicationStatus = "PUBLISHED"'];
    if (dto.genre?.trim()) {
      filters.push(`genres = "${dto.genre.trim().replaceAll('"', "")}"`);
    }

    try {
      const index = this.meili.index(MOVIES_INDEX);
      const result = await index.search(dto.q ?? "", {
        filter: filters.join(" AND "),
        limit: dto.limit,
        offset: dto.offset,
      });

      return {
        hits: result.hits,
        limit: dto.limit,
        offset: dto.offset,
        estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
      };
    } catch {
      throw new AppError(
        "UPSTREAM_UNAVAILABLE",
        "Meilisearch is unavailable.",
      );
    }
  }
}
