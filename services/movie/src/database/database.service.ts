import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import pg from "pg";

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
    return this.pool.query<T>(text, params);
  }
}
