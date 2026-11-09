#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/0f858766d114787134745a80038bb1c1aeacd65761e123af46bd80c401b19770/contract";
import endContract from "../../snapshots/0f858766d114787134745a80038bb1c1aeacd65761e123af46bd80c401b19770/contract.json" with { type: "json" };
import type { Contract as Start } from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract";
import startContract from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: "public",
        table: "auth_identities",
        columns: [
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("email", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("password_hash", "text", { codecRef: { codecId: "pg/text@1" } }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("user_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [
          primaryKey(["user_id"]),
          checkExpression(
            "auth_identities_compensated_credentials_check_a078c01e",
            "(status = 'COMPENSATED' AND email IS NULL AND password_hash IS NULL) OR (status <> 'COMPENSATED' AND email IS NOT NULL)",
          ),
          checkExpression(
            "auth_identities_status_check_3b7c904d",
            "\"status\" IN ('PENDING', 'PROFILE_CREATING', 'ACTIVE', 'COMPENSATING', 'COMPENSATED', 'DISABLED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "auth_outbox_events",
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
        table: "refresh_sessions",
        columns: [
          col("created_at", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("expires_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("revoked_at", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("rotated_from_session_id", "uuid", {
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("token_hash", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updated_at", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("user_id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.addUnique({
        schema: "public",
        table: "auth_identities",
        constraint: "auth_identities_email_key",
        columns: ["email"],
      }),
      this.addUnique({
        schema: "public",
        table: "refresh_sessions",
        constraint: "refresh_sessions_token_hash_key",
        columns: ["token_hash"],
      }),
      this.createIndex({
        schema: "public",
        table: "auth_outbox_events",
        index: "auth_outbox_events_status_idx",
        columns: ["status"],
      }),
      this.createIndex({
        schema: "public",
        table: "refresh_sessions",
        index: "refresh_sessions_expires_at_idx",
        columns: ["expires_at"],
      }),
      this.createIndex({
        schema: "public",
        table: "refresh_sessions",
        index: "refresh_sessions_user_id_idx",
        columns: ["user_id"],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
