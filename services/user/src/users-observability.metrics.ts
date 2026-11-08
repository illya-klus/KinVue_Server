import { getCounter, getHistogram } from "@kinvue/http-metrics";

export const usersProfileReads = getCounter(
  "users_profile_reads_total",
  "Users profile read operations",
  ["outcome"],
);

export const usersFriendshipOps = getCounter(
  "users_friendship_operations_total",
  "Users friendship operations",
  ["operation"],
);

export const usersSearchLatency = getHistogram(
  "users_search_latency_seconds",
  "Users search latency",
  ["outcome"],
);
