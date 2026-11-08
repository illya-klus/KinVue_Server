import { z } from "zod";

export const mediaTranscodeJobSchema = z.strictObject({
  jobId: z.string().trim().min(1),
  movieId: z.uuid(),
  originalKey: z.string().trim().min(1),
  attempt: z.number().int().min(1).max(3),
});

export type MediaTranscodeJob = z.infer<typeof mediaTranscodeJobSchema>;
