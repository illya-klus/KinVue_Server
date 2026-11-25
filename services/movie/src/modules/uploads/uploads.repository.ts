import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

export type MovieUploadStatus = "INITIATED" | "COMPLETED" | "ABANDONED";

export type MovieUploadRow = {
  id: string;
  movie_id: string;
  object_key: string;
  s3_upload_id: string;
  status: MovieUploadStatus;
  part_count: number;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UploadsRepository {
  constructor(private readonly db: DatabaseService) {}

  public async insertInitiated(input: {
    id: string;
    movieId: string;
    objectKey: string;
    s3UploadId: string;
    partCount?: number;
  }): Promise<MovieUploadRow> {
    const result = await this.db.query<MovieUploadRow>(
      `INSERT INTO movie_uploads (upload_id, movie_id, object_key, s3_upload_id, part_count, expires_at, updated_at, status)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours', NOW(), 'INITIATED')
       RETURNING upload_id AS id, movie_id, object_key, s3_upload_id, status::text AS status,
                 created_at, updated_at, part_count`,
      [
        input.id,
        input.movieId,
        input.objectKey,
        input.s3UploadId,
        input.partCount ?? 1,
      ],
    );
    return result.rows[0]!;
  }

  public async findInitiatedById(
    uploadId: string,
    movieId: string,
    includeCompleted = false,
  ): Promise<MovieUploadRow | undefined> {
    const result = await this.db.query<MovieUploadRow>(
      `SELECT upload_id AS id, movie_id, object_key, s3_upload_id, status::text AS status,
              created_at, updated_at, part_count
       FROM movie_uploads
       WHERE upload_id = $1 AND movie_id = $2 AND (status = 'INITIATED' OR ($3 AND status = 'COMPLETED'))`,
      [uploadId, movieId, includeCompleted],
    );
    return result.rows[0];
  }

  public async markCompleted(uploadId: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movie_uploads
       SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
       WHERE upload_id = $1 AND status = 'INITIATED'`,
      [uploadId],
    );
    return (result.rowCount ?? 0) > 0;
  }
  withMovieLock<T>(movieId: string, work: () => Promise<T>) {
    return this.db.withMovieLock(movieId, work);
  }

  async stale(): Promise<MovieUploadRow[]> {
    return (
      await this.db
        .query<MovieUploadRow>(`SELECT upload_id AS id, movie_id, object_key, s3_upload_id, status, part_count, created_at, updated_at
      FROM movie_uploads WHERE status = 'INITIATED' AND created_at < NOW() - INTERVAL '24 hours' ORDER BY created_at LIMIT 100`)
    ).rows;
  }
  async abandon(id: string, movieId: string) {
    await this.db.query(
      `UPDATE movie_uploads SET status = 'ABANDONED', updated_at = NOW() WHERE upload_id = $1 AND status = 'INITIATED'`,
      [id],
    );
    await this.db.query(
      `UPDATE movies SET media_status = 'ABANDONED', updated_at = NOW() WHERE movie_id = $1 AND media_status = 'UPLOADING'`,
      [movieId],
    );
  }
  async enqueue(job: {
    jobId: string;
    movieId: string;
    originalKey: string;
    attempt: number;
  }) {
    await this.db.query(
      `INSERT INTO movie_outbox_events (event_id, type, payload) VALUES ($1, 'media.transcode', $2::jsonb) ON CONFLICT DO NOTHING`,
      [job.jobId, JSON.stringify(job)],
    );
  }
  async pending() {
    return (
      await this.db.query<{
        event_id: string;
        payload: {
          jobId: string;
          movieId: string;
          originalKey: string;
          attempt: number;
        };
      }>(
        `SELECT event_id, payload FROM movie_outbox_events WHERE type = 'media.transcode' AND status = 'PENDING' ORDER BY created_at LIMIT 100`,
      )
    ).rows;
  }
  async sent(id: string) {
    await this.db.query(
      `UPDATE movie_outbox_events SET status = 'PUBLISHED', published_at = NOW() WHERE event_id = $1`,
      [id],
    );
  }
}
