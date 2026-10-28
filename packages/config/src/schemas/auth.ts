import { base, postgres, nonempty, port } from "./base.ts";
// Sprint 1 retains the current Google/HMAC runtime. RS256 sessions are a later Auth change.
export const authConfigSchema = base.extend({
  DATABASE_URL: postgres,
  GOOGLE_CLIENT_ID: nonempty,
  JWT_ACCESS_SECRET: nonempty,
  JWT_REFRESH_SECRET: nonempty,
  AUTH_GRPC_URL: nonempty.default("0.0.0.0:50051"),
  AUTH_HTTP_PORT: port.default(4001),
  AUTH_HTTP_HOST: nonempty.default("127.0.0.1"),
});
