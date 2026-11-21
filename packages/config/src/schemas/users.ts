import { base, url, port, nonempty, amqp } from "./base.ts";
export const usersConfigSchema = base.extend({
  USERS_HTTP_PORT: port.default(4002),
  USERS_HTTP_HOST: nonempty.default("127.0.0.1"),
  USERS_MONGO_URL: url(["mongodb:", "mongodb+srv:"]),
  // Optional for local runs; events stay pending until publishing is configured.
  RABBITMQ_URL: amqp.optional(),
});
