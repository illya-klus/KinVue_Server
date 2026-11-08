import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

export type MovieUploadStatus = "INITIATED" | "COMPLETED" | "ABANDONED";

export type MovieUploadRow = {
  id: string;
  movie_id: string;
  object_key: string;
  s3_upload_id: string;
  status: MovieUploadStatus;
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
  }): Promise<MovieUploadRow> {
    const result = await this.db.query<MovieUploadRow>(
      `INSERT INTO movie_uploads (id, movie_id, object_key, s3_upload_id, status)
       VALUES ($1, $2, $3, $4, 'INITIATED')
       RETURNING id, movie_id, object_key, s3_upload_id, status::text AS status,
                 created_at, updated_at`,
      [input.id, input.movieId, input.objectKey, input.s3UploadId],
    );
    return result.rows[0]!;
  }

  public async findInitiatedById(
    uploadId: string,
    movieId: string,
  ): Promise<MovieUploadRow | undefined> {
    const result = await this.db.query<MovieUploadRow>(
      `SELECT id, movie_id, object_key, s3_upload_id, status::text AS status,
              created_at, updated_at
       FROM movie_uploads
       WHERE id = $1 AND movie_id = $2 AND status = 'INITIATED'`,
      [uploadId, movieId],
    );
    return result.rows[0];
  }

  public async markCompleted(uploadId: string): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE movie_uploads
       SET status = 'COMPLETED', updated_at = NOW()
       WHERE id = $1 AND status = 'INITIATED'`,
      [uploadId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
