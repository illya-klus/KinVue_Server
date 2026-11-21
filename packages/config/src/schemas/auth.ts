import { base, postgres, nonempty, port } from "./base.ts";
export const authConfigSchema = base.extend({
  DATABASE_URL: postgres,
  GOOGLE_CLIENT_ID: nonempty,
  JWT_REFRESH_SECRET: nonempty,
  AUTH_JWT_PRIVATE_KEY: nonempty,
  AUTH_JWT_KEY_ID: nonempty,
  AUTH_GRPC_URL: nonempty.default("0.0.0.0:50051"),
  AUTH_HTTP_PORT: port.default(4001),
  AUTH_HTTP_HOST: nonempty.default("127.0.0.1"),
});
