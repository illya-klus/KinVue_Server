import { getCounter, getGauge, getHistogram } from "@kinvue/http-metrics";
import type { Counter, Gauge, Histogram } from "prom-client";

export const transcodeJobs: Counter<string> = getCounter(
  "media_transcode_jobs_total",
  "Transcode jobs processed",
  ["outcome"],
);

export const transcodeDuration: Histogram<string> = getHistogram(
  "media_transcode_duration_seconds",
  "Transcode job duration",
  ["outcome"],
);

export const transcodeQueueDepth: Gauge<string> = getGauge(
  "media_transcode_queue_depth",
  "media.transcode queue depth",
  ["service"],
);
