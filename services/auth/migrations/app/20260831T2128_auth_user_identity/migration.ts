#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract";
import startContract from "../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract";
import endContract from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
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
      this.dropTable({ schema: "public", table: "post" }),
      this.dropTable({ schema: "public", table: "user" }),
      this.createTable({
        schema: "public",
        table: "authUser",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
          col("email", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("provider", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("providerUserId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("role", "text", {
            notNull: true,
            default: lit("USER"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-string@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.addUnique({
        schema: "public",
        table: "authUser",
        constraint: "authUser_email_key",
        columns: ["email"],
      }),
      this.addUnique({
        schema: "public",
        table: "authUser",
        constraint: "authUser_provider_providerUserId_key",
        columns: ["provider", "providerUserId"],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
