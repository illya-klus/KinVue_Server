import { base, amqp, http, nonempty } from "./base.ts";
export const transcodeWorkerConfigSchema = base.extend({
  RABBITMQ_URL: amqp,
  S3_ENDPOINT: http,
  S3_ACCESS_KEY: nonempty,
  S3_SECRET_KEY: nonempty,
  S3_BUCKET: nonempty,
});
