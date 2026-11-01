import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import type { ReadinessCheck } from "./health.controller";
import { SharedLogger } from "./shared-logger";

@Injectable()
export class MoviePostgresReadiness
  implements ReadinessCheck, OnApplicationShutdown
{
  private readonly pool: Pool;
  constructor(config: ConfigService, logger: SharedLogger) {
    this.pool = new Pool({
      connectionString: config.getOrThrow<string>("MOVIE_DATABASE_URL"),
      max: 2,
      connectionTimeoutMillis: 1500,
      statement_timeout: 1500,
      query_timeout: 1500,
    });
    this.pool.on("error", () => logger.warn("database connection unavailable"));
  }
  async check(): Promise<void> {
    await this.pool.query("SELECT 1");
  }
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
