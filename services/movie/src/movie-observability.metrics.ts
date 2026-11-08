import { getCounter, getHistogram } from "@kinvue/http-metrics";
import type { Counter, Histogram } from "prom-client";

export const movieSearchRequests: Counter<string> = getCounter(
  "movie_search_requests_total",
  "Movie search requests",
  ["result"],
);

export const movieSearchLatency: Histogram<string> = getHistogram(
  "movie_search_latency_seconds",
  "Movie search latency",
  ["result"],
);

export const movieReconcileRuns: Counter<string> = getCounter(
  "movie_reconcile_runs_total",
  "Movie reconcile runs",
  ["outcome"],
);
