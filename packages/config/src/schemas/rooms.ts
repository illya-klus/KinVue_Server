import { base, redis, nonempty, port, postgres, amqp, http } from "./base.ts";
export const roomsConfigSchema = base.extend({
  ROOMS_HTTP_PORT: port.default(4004),
  ROOMS_HTTP_HOST: nonempty.default("127.0.0.1"),
  REDIS_URL: redis,
  ROOMS_WS_PORT: port.default(4014),
  AUTH_SERVICE_URL: http.default("http://localhost:4001"),
  JWT_ISSUER: nonempty.default("kinvue-auth"),
  JWT_AUDIENCE: nonempty.default("kinvue"),
  ROOMS_DATABASE_URL: postgres,
  RABBITMQ_URL: amqp.optional(),
});
