import { base, redis, nonempty, port, postgres, amqp } from "./base.ts";
export const roomsConfigSchema = base.extend({
  ROOMS_HTTP_PORT: port.default(4004),
  ROOMS_HTTP_HOST: nonempty.default("127.0.0.1"),
  REDIS_URL: redis,
  ROOMS_WS_PORT: port.default(4014),
  ROOMS_DATABASE_URL: postgres,
  RABBITMQ_URL: amqp.optional(),
});
