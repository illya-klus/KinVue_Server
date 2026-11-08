import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import { MoviesRepository } from "../../database/movies.repository";
import type { UploadInitDto } from "./dto/upload-init.dto";
import type { UploadCompleteDto } from "./dto/upload-complete.dto";
import { MediaTranscodePublisher } from "./media-transcode.publisher";
import { S3MultipartService } from "./s3-multipart.service";
import { UploadsRepository } from "./uploads.repository";

const MIN_FILE_SIZE_BYTES = 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 * 1024;

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
    private readonly transcode: MediaTranscodePublisher,
  ) {}

  public async initUpload(
    movieId: string,
    body: UploadInitDto,
  ): Promise<UploadInitResult> {
    this.assertFileSize(body.fileSizeBytes);
    this.assertPartCount(body.partCount, body.fileSizeBytes);

    const movie = await this.movies.findById(movieId);
    if (!movie) {
      throw new NotFoundException("Movie not found");
    }

    const uploadId = randomUUID();
    const fileName = sanitizeFileName(body.fileName);
    const objectKey = `movies/${movieId}/original/${uploadId}/${fileName}`;

    const s3UploadId = await this.s3.createMultipartUpload(
      objectKey,
      body.contentType,
    );
    await this.uploads.insertInitiated({
      id: uploadId,
      movieId,
      objectKey,
      s3UploadId,
    });
    await this.movies.setMediaUploading(movieId);

    const parts = await this.s3.presignUploadParts(
      objectKey,
      s3UploadId,
      body.partCount,
    );

    return { uploadId, parts };
  }

  public async completeUpload(
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

    const upload = await this.uploads.findInitiatedById(body.uploadId, movieId);
    if (!upload) {
      throw new NotFoundException("Upload not found");
    }

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

    await this.transcode.publish({
      jobId: randomUUID(),
      movieId,
      originalKey: upload.object_key,
      attempt: 1,
    });

    return { ok: true, mediaStatus: "PROCESSING" };
  }

  private assertFileSize(fileSizeBytes: number): void {
    if (fileSizeBytes <= MIN_FILE_SIZE_BYTES) {
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
    if (partCount < 1) {
      throw new AppError("VALIDATION_FAILED", "partCount must be at least 1");
    }
    const maxParts = Math.max(
      1,
      Math.ceil(fileSizeBytes / MIN_FILE_SIZE_BYTES),
    );
    if (partCount > maxParts) {
      throw new AppError("VALIDATION_FAILED", "partCount is too large");
    }
  }
}

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const base = basename(trimmed.replaceAll("\\", "/"));
  if (!base || base === "." || base === "..") {
    throw new AppError("VALIDATION_FAILED", "Invalid fileName");
  }
  return base;
}
