import { mediaTranscodeJobSchema } from "./media-transcode-job.schema";

describe("mediaTranscodeJobSchema", () => {
  it("accepts the documented payload shape", () => {
    const job = mediaTranscodeJobSchema.parse({
      jobId: "job_123",
      movieId: "550e8400-e29b-41d4-a716-446655440000",
      originalKey: "movies/movie_123/original/movie.mp4",
      attempt: 1,
    });
    expect(job.attempt).toBe(1);
  });
});
