import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService, type MovieRow } from "./database.service";

export type MovieMetadata = {
  title: string;
  description: string;
  genres: string[];
  durationSeconds?: number | null;
  posterKey?: string | null;
};
const columns = `movie_id AS id, title, description, genres,
  duration_seconds, poster_key, created_by_user_id, publication_status AS status,
  publish_at, media_status, original_object_key, hls_master_key, created_at, updated_at`;

@Injectable()
export class MoviesRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: MovieMetadata, userId: string): Promise<MovieRow> {
    const result = await this.db.query<MovieRow>(
      `INSERT INTO movies (movie_id, title, description, genres, duration_seconds, poster_key, created_by_user_id, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,NOW()) RETURNING ${columns}`,
      [
        randomUUID(),
        input.title,
        input.description,
        JSON.stringify(input.genres),
        input.durationSeconds ?? null,
        input.posterKey ?? null,
        userId,
      ],
    );
    return result.rows[0]!;
  }
  async update(
    id: string,
    input: Partial<MovieMetadata>,
  ): Promise<MovieRow | undefined> {
    const fields: [string, unknown][] = [];
    if (input.title !== undefined) fields.push(["title", input.title]);
    if (input.description !== undefined)
      fields.push(["description", input.description]);
    if (input.genres !== undefined)
      fields.push(["genres", JSON.stringify(input.genres)]);
    if (input.durationSeconds !== undefined)
      fields.push(["duration_seconds", input.durationSeconds]);
    if (input.posterKey !== undefined)
      fields.push(["poster_key", input.posterKey]);
    const assignments = fields.map(([key], index) => `${key} = $${index + 2}`);
    const result = await this.db.query<MovieRow>(
      `UPDATE movies SET ${[...assignments, "updated_at = NOW()"].join(", ")}
       WHERE movie_id = $1 AND media_status <> 'ABANDONED' RETURNING ${columns}`,
      [id, ...fields.map(([, value]) => value)],
    );
    return result.rows[0];
  }
  async findById(id: string): Promise<MovieRow | undefined> {
    return (
      await this.db.query<MovieRow>(
        `SELECT ${columns} FROM movies WHERE movie_id = $1`,
        [id],
      )
    ).rows[0];
  }
  async findPublishedById(id: string): Promise<MovieRow | undefined> {
    return (
      await this.db.query<MovieRow>(
        `SELECT ${columns} FROM movies WHERE movie_id = $1 AND publication_status = 'PUBLISHED'`,
        [id],
      )
    ).rows[0];
  }
  async publish(id: string): Promise<MovieRow | undefined> {
    return (
      await this.db.query<MovieRow>(
        `UPDATE movies SET publication_status = 'PUBLISHED', publish_at = COALESCE(publish_at,NOW()), updated_at = NOW()
       WHERE movie_id = $1 AND media_status = 'READY'
       AND (publication_status = 'DRAFT' OR (publication_status = 'SCHEDULED' AND publish_at <= NOW()))
       RETURNING ${columns}`,
        [id],
      )
    ).rows[0];
  }
  async schedule(id: string, publishAt: Date): Promise<MovieRow | undefined> {
    return (
      await this.db.query<MovieRow>(
        `UPDATE movies SET publication_status = 'SCHEDULED', publish_at = $2, updated_at = NOW()
       WHERE movie_id = $1 AND publication_status IN ('DRAFT','SCHEDULED')
       AND media_status <> 'ABANDONED' AND $2 > NOW() RETURNING ${columns}`,
        [id, publishAt],
      )
    ).rows[0];
  }
  async findDue(): Promise<MovieRow[]> {
    return (
      await this.db.query<MovieRow>(
        `SELECT ${columns} FROM movies WHERE publication_status = 'SCHEDULED' AND publish_at <= NOW()
       AND media_status = 'READY' ORDER BY publish_at, movie_id LIMIT 100`,
      )
    ).rows;
  }
  async addToWatchlist(userId: string, movieId: string): Promise<boolean> {
    const result = await this.db.query(
      `WITH visible AS (SELECT movie_id FROM movies WHERE movie_id = $2 AND publication_status = 'PUBLISHED'),
       inserted AS (INSERT INTO watchlist_items (user_id,movie_id) SELECT $1,movie_id FROM visible
         ON CONFLICT DO NOTHING RETURNING movie_id)
       SELECT movie_id FROM visible`,
      [userId, movieId],
    );
    return result.rows.length > 0;
  }
  async removeFromWatchlist(userId: string, movieId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM watchlist_items WHERE user_id = $1 AND movie_id = $2`,
      [userId, movieId],
    );
  }
  async listWatchlist(userId: string) {
    return (
      await this.db.query<{
        movieId: string;
        title: string;
        posterKey: string | null;
        addedAt: Date;
      }>(
        `SELECT m.movie_id AS "movieId", m.title, m.poster_key AS "posterKey", w.created_at AS "addedAt"
       FROM watchlist_items w JOIN movies m ON m.movie_id = w.movie_id
       WHERE w.user_id = $1 AND m.publication_status = 'PUBLISHED' ORDER BY w.created_at DESC, m.movie_id`,
        [userId],
      )
    ).rows;
  }
  async setMediaUploading(id: string): Promise<boolean> {
    return this.setMedia(
      id,
      "media_status = 'UPLOADING'",
      [],
      "media_status IN ('NONE','UPLOAD_FAILED')",
    );
  }
  async setMediaProcessing(id: string, key: string): Promise<boolean> {
    return this.setMedia(
      id,
      "media_status = 'PROCESSING', original_object_key = $2",
      [key],
      "media_status = 'UPLOADING'",
    );
  }
  async markMediaReady(id: string, key: string): Promise<boolean> {
    return this.setMedia(
      id,
      "media_status = 'READY', hls_master_key = $2",
      [key],
      "media_status = 'PROCESSING'",
    );
  }
  async markMediaFailed(id: string): Promise<boolean> {
    return this.setMedia(
      id,
      "media_status = 'PROCESSING_FAILED'",
      [],
      "media_status = 'PROCESSING'",
    );
  }
  private async setMedia(
    id: string,
    assignment: string,
    values: unknown[],
    condition: string,
  ): Promise<boolean> {
    return (
      ((
        await this.db.query(
          `UPDATE movies SET ${assignment}, updated_at = NOW() WHERE movie_id = $1 AND ${condition}`,
          [id, ...values],
        )
      ).rowCount ?? 0) > 0
    );
  }
  async listPublishedUpdatedBetween(from: Date, to: Date): Promise<MovieRow[]> {
    return (
      await this.db.query<MovieRow>(
        `SELECT ${columns} FROM movies WHERE publication_status = 'PUBLISHED'
      AND updated_at >= $1 AND updated_at < $2 ORDER BY updated_at`,
        [from, to],
      )
    ).rows;
  }
  async listAllPublished(): Promise<MovieRow[]> {
    return (
      await this.db.query<MovieRow>(
        `SELECT ${columns} FROM movies WHERE publication_status = 'PUBLISHED' ORDER BY created_at`,
      )
    ).rows;
  }
}
