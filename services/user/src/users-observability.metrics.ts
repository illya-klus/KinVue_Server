import { getCounter, getHistogram } from "@kinvue/http-metrics";
import type { Counter, Histogram } from "prom-client";

export const usersProfileReads: Counter<string> = getCounter(
  "users_profile_reads_total",
  "Users profile read operations",
  ["outcome"],
);

export const usersFriendshipOps: Counter<string> = getCounter(
  "users_friendship_operations_total",
  "Users friendship operations",
  ["operation"],
);

export const usersSearchLatency: Histogram<string> = getHistogram(
  "users_search_latency_seconds",
  "Users search latency",
  ["outcome"],
);
