#!/usr/bin/env -S node
import type { Contract as Start } from "../../snapshots/614f5257871f7e6b507aefac0a158e73b53aefa02ec6325c9695effc09ca7421/contract";
import startContract from "../../snapshots/614f5257871f7e6b507aefac0a158e73b53aefa02ec6325c9695effc09ca7421/contract.json" with { type: "json" };
import type { Contract as End } from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract";
import endContract from "../../snapshots/99cb01621012a9e43a321f446c880951ba909cf6312a4c0e91da3febb95ad77a/contract.json" with { type: "json" };
import { Migration, MigrationCLI } from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: "public",
        table: "authUser",
        constraint: "authUser_providerUserId_key",
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
