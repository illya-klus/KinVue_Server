import { randomUUID } from "node:crypto";
import { MovieUploadService } from "./movie-upload.service";

describe("MovieUploadService completeUpload", () => {
  const movieId = randomUUID();
  const uploadId = randomUUID();
  const objectKey = `movies/${movieId}/original/${uploadId}/clip.mp4`;

  const movies = {
    setMediaProcessing: jest.fn().mockResolvedValue(true),
  };
  const uploads = {
    findInitiatedById: jest.fn().mockResolvedValue({
      id: uploadId,
      movie_id: movieId,
      object_key: objectKey,
      s3_upload_id: "s3-upload-1",
      status: "INITIATED",
      part_count: 1,
    }),
    withMovieLock: jest.fn((_id, work) => work()),
    enqueue: jest.fn().mockResolvedValue(undefined),
    markCompleted: jest.fn().mockResolvedValue(true),
  };
  const s3 = {
    completeMultipartUpload: jest.fn().mockResolvedValue(undefined),
  };

  const service = new MovieUploadService(
    movies as never,
    uploads as never,
    s3 as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    uploads.findInitiatedById.mockResolvedValue({
      id: uploadId,
      movie_id: movieId,
      object_key: objectKey,
      s3_upload_id: "s3-upload-1",
      status: "INITIATED",
      part_count: 1,
    });
    uploads.markCompleted.mockResolvedValue(true);
    movies.setMediaProcessing.mockResolvedValue(true);
    s3.completeMultipartUpload.mockResolvedValue(undefined);
  });

  it("completes multipart upload and enqueues transcode job", async () => {
    const result = await service.completeUpload(movieId, {
      uploadId,
      parts: [{ partNumber: 1, etag: '"etag-1"' }],
    });

    expect(s3.completeMultipartUpload).toHaveBeenCalledWith(
      objectKey,
      "s3-upload-1",
      [{ partNumber: 1, etag: '"etag-1"' }],
    );
    expect(movies.setMediaProcessing).toHaveBeenCalledWith(movieId, objectKey);
    expect(uploads.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        movieId,
        originalKey: objectKey,
        attempt: 1,
        jobId: expect.any(String),
      }),
    );
    expect(result).toEqual({ ok: true, mediaStatus: "PROCESSING" });
  });

  it("rejects missing ETags without updating movie processing state", async () => {
    await expect(
      service.completeUpload(movieId, {
        uploadId,
        parts: [{ partNumber: 1, etag: "  " }],
      }),
    ).rejects.toThrow("Each part must include an ETag");

    expect(s3.completeMultipartUpload).not.toHaveBeenCalled();
    expect(movies.setMediaProcessing).not.toHaveBeenCalled();
    expect(uploads.enqueue).not.toHaveBeenCalled();
  });
});
