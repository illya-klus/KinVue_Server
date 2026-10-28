import { z } from "zod";
import { config as loadEnvironment } from "dotenv";
export { z } from "zod";

export class ConfigError extends Error {
  readonly fields: readonly string[];
  constructor(fields: string[]) {
    super(`Invalid configuration fields: ${fields.join(", ")}`);
    this.name = "ConfigError";
    this.fields = fields;
  }
}

/** Only field paths are exposed. Never retain raw env values or Zod messages. */
export function loadConfig<S extends z.ZodType>(
  schema: S,
  env: Record<string, unknown> = process.env,
): z.output<S> {
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new ConfigError([
      ...new Set(
        parsed.error.issues.map(
          (issue) => issue.path.join(".") || "configuration",
        ),
      ),
    ]);
  return parsed.data;
}

export function loadEnvironmentConfig<S extends z.ZodType>(
  schema: S,
): z.output<S> {
  loadEnvironment({ quiet: true });
  return loadConfig(schema);
}

export { port } from "./schemas/base.ts";
import { authConfigSchema } from "./schemas/auth.ts";
import { usersConfigSchema } from "./schemas/users.ts";
import { movieConfigSchema } from "./schemas/movie.ts";
import { roomsConfigSchema } from "./schemas/rooms.ts";
import { notificationsConfigSchema } from "./schemas/notifications.ts";
import { gatewayConfigSchema } from "./schemas/gateway.ts";
import { transcodeWorkerConfigSchema } from "./schemas/transcode-worker.ts";
import { webConfigSchema } from "./schemas/web.ts";
export {
  authConfigSchema,
  usersConfigSchema,
  movieConfigSchema,
  roomsConfigSchema,
  notificationsConfigSchema,
  gatewayConfigSchema,
  transcodeWorkerConfigSchema,
  webConfigSchema,
};
export const serviceSchemas = {
  auth: authConfigSchema,
  users: usersConfigSchema,
  movie: movieConfigSchema,
  rooms: roomsConfigSchema,
  notifications: notificationsConfigSchema,
  gateway: gatewayConfigSchema,
  transcodeWorker: transcodeWorkerConfigSchema,
  web: webConfigSchema,
};
