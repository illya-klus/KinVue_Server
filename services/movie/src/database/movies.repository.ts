import { Injectable } from "@nestjs/common";
import { DatabaseService, type MovieRow } from "./database.service";

@Injectable()
export class MoviesRepository {
  constructor(private readonly db: DatabaseService) {}

  public async findById(id: string): Promise<MovieRow | undefined> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, media_status::text AS media_status,
              original_object_key, hls_master_key,
              created_at, updated_at
       FROM movies WHERE id = $1`,
      [id],
    );
    return result.rows[0];
  }

  public async setMediaUploading(movieId: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movies
       SET media_status = 'UPLOADING',
           updated_at = NOW()
       WHERE id = $1`,
      [movieId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async setMediaProcessing(
    movieId: string,
    originalObjectKey: string,
  ): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movies
       SET media_status = 'PROCESSING',
           original_object_key = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [movieId, originalObjectKey],
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async findPublishedById(id: string): Promise<MovieRow | undefined> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, created_at, updated_at
       FROM movies WHERE id = $1 AND status = 'PUBLISHED'`,
      [id],
    );
    return result.rows[0];
  }

  public async listPublishedUpdatedBetween(
    from: Date,
    to: Date,
  ): Promise<MovieRow[]> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, created_at, updated_at
       FROM movies
       WHERE status = 'PUBLISHED'
         AND updated_at >= $1 AND updated_at < $2
       ORDER BY updated_at ASC`,
      [from, to],
    );
    return result.rows;
  }

  public async markMediaReady(
    movieId: string,
    masterKey: string,
  ): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movies
       SET media_status = 'READY',
           hls_master_key = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [movieId, masterKey],
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async markMediaFailed(movieId: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movies
       SET media_status = 'PROCESSING_FAILED',
           updated_at = NOW()
       WHERE id = $1`,
      [movieId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async listAllPublished(): Promise<MovieRow[]> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, created_at, updated_at
       FROM movies WHERE status = 'PUBLISHED' ORDER BY created_at ASC`,
    );
    return result.rows;
  }
}
