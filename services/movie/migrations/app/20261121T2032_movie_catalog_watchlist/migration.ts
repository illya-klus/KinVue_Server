#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/97b2b182a74e0065ef4b57231bf953e621e7bd81685366529e7890a76627be48/contract";
import endContract from "../../snapshots/97b2b182a74e0065ef4b57231bf953e621e7bd81685366529e7890a76627be48/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: "public" }),
      this.createTable({
        schema: "public",
        table: "movie_index_sync_state",
        columns: [
          col("id", "text", {
            notNull: true,
            default: lit("movies"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("last_successful_sync", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "movie_outbox_events",
        columns: [
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("event_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("payload", "jsonb", {
            notNull: true,
            codecRef: { codecId: "pg/jsonb@1" },
          }),
          col("published_at", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("retry_count", "int4", {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("type", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
        ],
        constraints: [primaryKey(["event_id"])],
      }),
      this.createTable({
        schema: "public",
        table: "movie_uploads",
        columns: [
          col("completed_at", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("expires_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("movie_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("object_key", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("part_count", "int4", {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("s3_upload_id", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("INITIATED"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("upload_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [primaryKey(["upload_id"])],
      }),
      this.createTable({
        schema: "public",
        table: "movies",
        columns: [
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("created_by_user_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("description", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("duration_seconds", "int4", {
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("genres", "jsonb", {
            notNull: true,
            codecRef: { codecId: "pg/jsonb@1" },
          }),
          col("hls_master_key", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("media_status", "text", {
            notNull: true,
            default: lit("NONE"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("movie_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("original_object_key", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("poster_key", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("publication_status", "text", {
            notNull: true,
            default: lit("DRAFT"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("publish_at", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("title", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
        ],
        constraints: [
          primaryKey(["movie_id"]),
          checkExpression(
            "movies_media_status_check_9a280471",
            "\"media_status\" IN ('NONE', 'UPLOADING', 'PROCESSING', 'READY', 'UPLOAD_FAILED', 'PROCESSING_FAILED', 'ABANDONED')",
          ),
          checkExpression(
            "movies_publication_status_check_ecb2d041",
            "\"publication_status\" IN ('DRAFT', 'SCHEDULED', 'PUBLISHED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "watchlist_items",
        columns: [
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("movie_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("user_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [primaryKey(["user_id", "movie_id"])],
      }),
      this.createIndex({
        schema: "public",
        table: "movie_outbox_events",
        index: "movie_outbox_events_status_idx",
        columns: ["status"],
      }),
      this.createIndex({
        schema: "public",
        table: "movie_uploads",
        index: "movie_uploads_movie_id_idx",
        columns: ["movie_id"],
      }),
      this.createIndex({
        schema: "public",
        table: "movies",
        index: "movies_publication_status_idx",
        columns: ["publication_status"],
      }),
      this.createIndex({
        schema: "public",
        table: "movies",
        index: "movies_publish_at_idx",
        columns: ["publish_at"],
      }),
      this.createIndex({
        schema: "public",
        table: "movies",
        index: "movies_updated_at_idx",
        columns: ["updated_at"],
      }),
      this.createIndex({
        schema: "public",
        table: "watchlist_items",
        index: "watchlist_items_user_id_idx",
        columns: ["user_id"],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
