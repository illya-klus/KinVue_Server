import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { AsyncLocalStorage } from "node:async_hooks";

export type MovieStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export type MediaStatus =
  | "NONE"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "UPLOAD_FAILED"
  | "PROCESSING_FAILED"
  | "ABANDONED";

export type MovieRow = {
  id: string;
  title: string;
  description: string;
  genres: string[];
  duration_seconds?: number | null;
  poster_key?: string | null;
  created_by_user_id?: string;
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
  private pool!: pg.Pool;
  private readonly transaction = new AsyncLocalStorage<pg.PoolClient>();

  public async withMovieLock<T>(
    movieId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [movieId],
      );
      const result = await this.transaction.run(client, work);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    this.pool = new pg.Pool({
      connectionString: this.config.getOrThrow<string>("MOVIE_DATABASE_URL"),
    });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  public query<T extends pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return (this.transaction.getStore() ?? this.pool).query<T>(text, params);
  }
}
