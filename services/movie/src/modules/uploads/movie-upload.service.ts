import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import { MoviesRepository } from "../../database/movies.repository";
import type { UploadInitDto } from "./dto/upload-init.dto";
import type { UploadCompleteDto } from "./dto/upload-complete.dto";
import { S3MultipartService } from "./s3-multipart.service";
import { UploadsRepository } from "./uploads.repository";

const MIN_FILE_SIZE_BYTES = 1_000_000;
const MAX_FILE_SIZE_BYTES = 25_000_000_000;

export type UploadInitResult = {
  uploadId: string;
  parts: { partNumber: number; url: string }[];
};

@Injectable()
export class MovieUploadService {
  constructor(
    private readonly movies: MoviesRepository,
    private readonly uploads: UploadsRepository,
    private readonly s3: S3MultipartService,
  ) {}

  public async initUpload(
    movieId: string,
    body: UploadInitDto,
  ): Promise<UploadInitResult> {
    return this.uploads.withMovieLock(movieId, () =>
      this.initLocked(movieId, body),
    );
  }

  private async initLocked(
    movieId: string,
    body: UploadInitDto,
  ): Promise<UploadInitResult> {
    this.assertFileSize(body.fileSizeBytes);
    if (
      !["video/mp4", "video/quicktime", "video/x-matroska"].includes(
        body.contentType,
      )
    )
      throw new AppError("VALIDATION_FAILED", "Unsupported video type");
    this.assertPartCount(body.partCount, body.fileSizeBytes);

    const movie = await this.movies.findById(movieId);
    if (!movie) {
      throw new NotFoundException("Movie not found");
    }

    if (
      !["NONE", "UPLOAD_FAILED", "ABANDONED"].includes(
        movie.media_status ?? "NONE",
      )
    )
      throw new AppError(
        "CONFLICT",
        "Media cannot be replaced in its current state",
      );
    const uploadId = randomUUID();
    const fileName = sanitizeFileName(body.fileName);
    const objectKey = `movies/${movieId}/original/${uploadId}/${fileName}`;

    const s3UploadId = await this.s3.createMultipartUpload(
      objectKey,
      body.contentType,
    );
    try {
      await this.uploads.insertInitiated({
        id: uploadId,
        movieId,
        objectKey,
        s3UploadId,
        partCount: body.partCount,
      });
      if (!(await this.movies.setMediaUploading(movieId)))
        throw new AppError("CONFLICT", "Media state changed");

      const parts = await this.s3.presignUploadParts(
        objectKey,
        s3UploadId,
        body.partCount,
      );

      return { uploadId, parts };
    } catch (error) {
      await this.s3
        .abortMultipartUpload(objectKey, s3UploadId)
        .catch(() => undefined);
      throw error;
    }
  }

  public async completeUpload(
    movieId: string,
    body: UploadCompleteDto,
  ): Promise<{ ok: true; mediaStatus: "PROCESSING" }> {
    return this.uploads.withMovieLock(movieId, () =>
      this.completeLocked(movieId, body),
    );
  }

  private async completeLocked(
    movieId: string,
    body: UploadCompleteDto,
  ): Promise<{ ok: true; mediaStatus: "PROCESSING" }> {
    if (!body.parts.length) {
      throw new AppError("VALIDATION_FAILED", "Upload parts are required");
    }
    const partNumbers = new Set<number>();
    for (const part of body.parts) {
      const etag = part.etag?.trim();
      if (!etag) {
        throw new AppError(
          "VALIDATION_FAILED",
          "Each part must include an ETag",
        );
      }
      if (partNumbers.has(part.partNumber)) {
        throw new AppError("VALIDATION_FAILED", "Duplicate part numbers");
      }
      partNumbers.add(part.partNumber);
    }

    const upload = await this.uploads.findInitiatedById(
      body.uploadId,
      movieId,
      true,
    );
    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

    if (
      body.parts.length !== upload.part_count ||
      body.parts.some(
        (p) =>
          !Number.isInteger(p.partNumber) ||
          p.partNumber < 1 ||
          p.partNumber > upload.part_count,
      )
    )
      throw new AppError(
        "VALIDATION_FAILED",
        "All expected parts are required",
      );
    if (upload.status === "COMPLETED")
      return { ok: true, mediaStatus: "PROCESSING" };
    await this.s3.completeMultipartUpload(
      upload.object_key,
      upload.s3_upload_id,
      body.parts,
    );

    const markedUpload = await this.uploads.markCompleted(upload.id);
    if (!markedUpload) {
      throw new AppError("CONFLICT", "Upload is no longer in initiated state");
    }

    const markedMovie = await this.movies.setMediaProcessing(
      movieId,
      upload.object_key,
    );
    if (!markedMovie) {
      throw new NotFoundException("Movie not found");
    }

    await this.uploads.enqueue({
      jobId: randomUUID(),
      movieId,
      originalKey: upload.object_key,
      attempt: 1,
    });

    return { ok: true, mediaStatus: "PROCESSING" };
  }

  async refreshParts(
    movieId: string,
    uploadId: string,
  ): Promise<UploadInitResult> {
    return this.uploads.withMovieLock(movieId, async () => {
      const upload = await this.uploads.findInitiatedById(uploadId, movieId);
      if (
        !upload ||
        Date.now() - new Date(upload.created_at).getTime() > 86_400_000
      )
        throw new NotFoundException("Active upload not found");
      return {
        uploadId,
        parts: await this.s3.presignUploadParts(
          upload.object_key,
          upload.s3_upload_id,
          upload.part_count,
        ),
      };
    });
  }

  private assertFileSize(fileSizeBytes: number): void {
    if (
      !Number.isSafeInteger(fileSizeBytes) ||
      fileSizeBytes <= MIN_FILE_SIZE_BYTES
    ) {
      throw new AppError(
        "VALIDATION_FAILED",
        "File size must be greater than 1 MB",
      );
    }
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        "VALIDATION_FAILED",
        "File size must be at most 25 GB",
      );
    }
  }

  private assertPartCount(partCount: number, fileSizeBytes: number): void {
    if (!Number.isInteger(partCount) || partCount < 1) {
      throw new AppError("VALIDATION_FAILED", "partCount must be at least 1");
    }
    const maxParts = Math.min(
      10_000,
      Math.max(1, Math.ceil(fileSizeBytes / (5 * 1024 * 1024))),
    );
    if (partCount > maxParts) {
      throw new AppError("VALIDATION_FAILED", "partCount is too large");
    }
  }
}

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const base = basename(trimmed.replaceAll("\\", "/"));
  if (
    !base ||
    base === "." ||
    base === ".." ||
    [...base].some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  ) {
    throw new AppError("VALIDATION_FAILED", "Invalid fileName");
  }
  return base;
}
