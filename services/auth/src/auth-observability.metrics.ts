import { getCounter } from "@kinvue/http-metrics";

export const authLoginAttempts = getCounter(
  "auth_login_attempts_total",
  "Auth login attempts",
  ["outcome"],
);

export const authRegistrationAttempts = getCounter(
  "auth_registration_attempts_total",
  "Auth registration attempts",
  ["outcome"],
);
