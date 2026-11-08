import { getCounter, getGauge, getHistogram } from "@kinvue/http-metrics";

export const transcodeJobs = getCounter(
  "media_transcode_jobs_total",
  "Transcode jobs processed",
  ["outcome"],
);

export const transcodeDuration = getHistogram(
  "media_transcode_duration_seconds",
  "Transcode job duration",
  ["outcome"],
);

export const transcodeQueueDepth = getGauge(
  "media_transcode_queue_depth",
  "media.transcode queue depth",
  ["service"],
);
