import { z } from "zod";
export const port = z.coerce.number().int().min(1).max(65535);
export const nonempty = z.string().trim().min(1);
export const url = (protocols: string[]) =>
  nonempty.refine((value) => {
    try {
      return protocols.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  });
export const postgres = url(["postgres:", "postgresql:"]);
export const redis = url(["redis:", "rediss:"]);
export const amqp = url(["amqp:", "amqps:"]);
export const http = url(["http:", "https:"]);
export const base = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: port.default(3000),
});
