import { getGauge } from "@kinvue/http-metrics";
import type { Gauge } from "prom-client";

export const roomsWebsocketConnections: Gauge<string> = getGauge(
  "rooms_websocket_connections",
  "Active Rooms WebSocket connections",
  ["service"],
);

export const roomsRedisReachable: Gauge<string> = getGauge(
  "rooms_redis_reachable",
  "Whether Rooms Redis responds to PING (1/0)",
  ["service"],
);
