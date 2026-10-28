import { base, postgres, amqp } from "./base.ts";
export const notificationsConfigSchema = base.extend({
  NOTIFICATIONS_DATABASE_URL: postgres,
  RABBITMQ_URL: amqp,
});
