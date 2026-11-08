import { getCounter } from "@kinvue/http-metrics";
import type { Counter } from "prom-client";

export const authLoginAttempts: Counter<string> = getCounter(
  "auth_login_attempts_total",
  "Auth login attempts",
  ["outcome"],
);

export const authRegistrationAttempts: Counter<string> = getCounter(
  "auth_registration_attempts_total",
  "Auth registration attempts",
  ["outcome"],
);
