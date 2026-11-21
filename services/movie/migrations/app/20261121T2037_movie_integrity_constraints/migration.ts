#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/97b2b182a74e0065ef4b57231bf953e621e7bd81685366529e7890a76627be48/contract";
import startContract from "../../snapshots/97b2b182a74e0065ef4b57231bf953e621e7bd81685366529e7890a76627be48/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/eb4446dd6a943f2c9d85d7f4f5e21854f992c28e492e614bece9ae0345bb0d96/contract";
import endContract from "../../snapshots/eb4446dd6a943f2c9d85d7f4f5e21854f992c28e492e614bece9ae0345bb0d96/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addCheckConstraint({
        schema: "public",
        table: "movie_index_sync_state",
        constraint: "singleton_efc917f2",
        expression: "id = 'movies'",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "movie_uploads",
        constraint: "part_count_positive_1e73b9f9",
        expression: "part_count > 0",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "movies",
        constraint: "duration_positive_e3f8f01a",
        expression: "duration_seconds IS NULL OR duration_seconds > 0",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "movies",
        constraint: "genres_array_07f39a9a",
        expression: "jsonb_typeof(genres) = 'array'",
      }),
      this.addCheckConstraint({
        schema: "public",
        table: "movies",
        constraint: "scheduled_time_4d6f34fc",
        expression:
          "publication_status <> 'SCHEDULED' OR publish_at IS NOT NULL",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
