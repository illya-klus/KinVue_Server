import { Injectable } from "@nestjs/common";
import { DatabaseService, type MovieRow } from "./database.service";

@Injectable()
export class MoviesRepository {
  constructor(private readonly db: DatabaseService) {}

  public async findById(id: string): Promise<MovieRow | undefined> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, created_at, updated_at
       FROM movies WHERE id = $1`,
      [id],
    );
    return result.rows[0];
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

  public async listAllPublished(): Promise<MovieRow[]> {
    const result = await this.db.query<MovieRow>(
      `SELECT id, title, description, genres, status::text AS status,
              publish_at, created_at, updated_at
       FROM movies WHERE status = 'PUBLISHED' ORDER BY created_at ASC`,
    );
    return result.rows;
  }
}
