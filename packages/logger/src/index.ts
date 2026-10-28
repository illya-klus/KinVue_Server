const REDACTED = "[REDACTED]";
const secretKey =
  /password|passwd|secret|token|authorization|cookie|credential|privatekey|apikey|databaseurl|mongourl|redisurl|rabbitmqurl/i;

function redactText(value: string): string {
  return value
    .replace(/\bBearer\s+[^\s,;"'<>]+/gi, `Bearer ${REDACTED}`)
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, REDACTED)
    .replace(
      /((?:password|passwd|password[_-]?hash|access[_-]?token|refresh[_-]?token|secret|authorization|api[_-]?key)\s*[=:]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi,
      `$1${REDACTED}`,
    )
    .replace(
      /([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi,
      `$1${REDACTED}@`,
    )
    .replace(
      /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
      REDACTED,
    );
}

export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactText(value);
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (value instanceof Error)
    return {
      name: value.name,
      message: redactText(value.message),
      stack: value.stack ? redactText(value.stack) : undefined,
    };
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      secretKey.test(key.replace(/[_-]/g, "")) ? REDACTED : redact(item, seen),
    ]),
  );
}

export interface LogFields {
  requestId?: string;
  userId?: string;
  route?: string;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
}
export type LogLevel = "info" | "warn" | "error" | "debug";
export function createLogger(
  service: string,
  write: (line: string) => void = (line) => {
    process.stdout.write(line);
  },
) {
  const log = (level: LogLevel, message: string, fields: LogFields = {}) => {
    const record = redact({
      ...fields,
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
    });
    write(JSON.stringify(record) + "\n");
  };
  return {
    info: (message: string, fields?: LogFields) => log("info", message, fields),
    warn: (message: string, fields?: LogFields) => log("warn", message, fields),
    error: (message: string, fields?: LogFields) =>
      log("error", message, fields),
    debug: (message: string, fields?: LogFields) =>
      log("debug", message, fields),
  };
}
