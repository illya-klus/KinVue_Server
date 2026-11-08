import { getGauge } from "@kinvue/http-metrics";

export const roomsWebsocketConnections = getGauge(
  "rooms_websocket_connections",
  "Active Rooms WebSocket connections",
  ["service"],
);

export const roomsRedisReachable = getGauge(
  "rooms_redis_reachable",
  "Whether Rooms Redis responds to PING (1/0)",
  ["service"],
);
