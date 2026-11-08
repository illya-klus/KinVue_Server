import { Injectable } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import { MeilisearchClient } from "../meilisearch/meilisearch.client";
import { MOVIES_INDEX } from "../meilisearch/meilisearch.constants";
import {
  movieSearchLatency,
  movieSearchRequests,
} from "../../movie-observability.metrics";
import type { SearchQueryDto } from "./search-query.dto";

@Injectable()
export class MoviesSearchService {
  constructor(private readonly meili: MeilisearchClient) {}

  public async search(dto: SearchQueryDto) {
    const started = process.hrtime.bigint();
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

      const response = {
        hits: result.hits,
        limit: dto.limit,
        offset: dto.offset,
        estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
      };
      movieSearchRequests.inc({ result: "ok" });
      movieSearchLatency.observe(
        { result: "ok" },
        Number(process.hrtime.bigint() - started) / 1e9,
      );
      return response;
    } catch {
      movieSearchRequests.inc({ result: "error" });
      movieSearchLatency.observe(
        { result: "error" },
        Number(process.hrtime.bigint() - started) / 1e9,
      );
      throw new AppError("UPSTREAM_UNAVAILABLE", "Meilisearch is unavailable.");
    }
  }
}
