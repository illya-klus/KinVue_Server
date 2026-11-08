import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export type MovieStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export type MediaStatus =
  "NONE" | "UPLOADING" | "PROCESSING" | "READY" | "PROCESSING_FAILED";

export type MovieRow = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  status: MovieStatus;
  publish_at: Date | null;
  media_status?: MediaStatus;
  original_object_key?: string | null;
  hls_master_key?: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: pg.Pool;

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    this.pool = new pg.Pool({
      connectionString: this.config.getOrThrow<string>("MOVIE_DATABASE_URL"),
    });
    await this.runMigrations();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  public query<T extends pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  private async runMigrations(): Promise<void> {
    for (const file of [
      "001_movies.sql",
      "002_media_status.sql",
      "003_movie_uploads.sql",
    ]) {
      const sqlPath = join(process.cwd(), "migrations", file);
      const sql = readFileSync(sqlPath, "utf8");
      await this.pool.query(sql);
    }
    this.logger.log("Movie database migrations applied");
  }
}
