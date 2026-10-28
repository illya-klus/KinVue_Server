import { z } from "zod";
import { base, port, http, nonempty } from "./base.ts";
export const gatewayConfigSchema = base.extend({
  PORT: port,
  ORIGINS: nonempty
    .transform((value) => value.split(",").map((item) => item.trim()))
    .pipe(z.array(http).min(1)),
  AUTH_GRPC_URL: nonempty.default("localhost:50051"),
  ROOMS_GRPC_URL: nonempty.default("localhost:50054"),
});
