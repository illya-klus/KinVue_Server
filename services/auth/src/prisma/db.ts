import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import { Pool } from "pg";
import { createLogger } from "@kinvue/logger";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  connectionTimeoutMillis: 1500,
  idleTimeoutMillis: 30000,
});
pool.on("error", (error) =>
  createLogger("auth").warn("database pool connection failed", { error }),
);
export const db = postgres<Contract>({
  contractJson,
  pg: pool,
});
