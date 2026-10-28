import { z } from "zod";
import { http } from "./base.ts";
export const webConfigSchema = z.object({ VITE_GATEWAY_URL: http });
