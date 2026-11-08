import { getCounter, getHistogram } from "@kinvue/http-metrics";

export const movieSearchRequests = getCounter(
  "movie_search_requests_total",
  "Movie search requests",
  ["result"],
);

export const movieSearchLatency = getHistogram(
  "movie_search_latency_seconds",
  "Movie search latency",
  ["result"],
);

export const movieReconcileRuns = getCounter(
  "movie_reconcile_runs_total",
  "Movie reconcile runs",
  ["outcome"],
);
