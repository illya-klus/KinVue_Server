import { base, redis, nonempty, port } from "./base.ts";
// The scaffold owns only Redis readiness; durable storage arrives with its feature tickets.
export const roomsConfigSchema = base.extend({
  PORT: port.default(4004),
  HOST: nonempty.default("127.0.0.1"),
  REDIS_URL: redis,
  ROOMS_WS_PORT: port.default(4014),
});
