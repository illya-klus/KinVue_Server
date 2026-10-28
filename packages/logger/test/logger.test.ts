import { test } from "node:test";
import assert from "node:assert/strict";
import { createLogger, redact } from "../src/index.ts";

test("one JSON object per line with request context", () => {
  const lines: string[] = [];
  createLogger("auth", (line) => lines.push(line)).info("line one\nline two", {
    requestId: "r",
    userId: "u",
    route: "/login",
    durationMs: 4,
    error: new Error("safe"),
  });
  assert.equal(lines[0].split("\n").length, 2);
  const record = JSON.parse(lines[0]);
  assert.equal(record.service, "auth");
  assert.equal(record.requestId, "r");
  assert.equal(record.userId, "u");
  assert.equal(record.route, "/login");
  assert.equal(record.durationMs, 4);
  assert.equal(record.error.message, "safe");
});
test("nested credentials, bearer strings, hashes, JWTs, URLs and error messages are scrubbed", () => {
  const input = {
    password: "pw-value",
    nested: [{ refresh_token: "refresh-value", passwordHash: "hash-value" }],
    headers: { authorization: "Bearer bearer-value", cookie: "cookie-value" },
    message:
      'password="quoted value" Bearer bearer-value postgres://bob:db-value@localhost/db eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1In0.signature',
    error: new Error("access_token=access-value"),
  };
  const output = JSON.stringify(redact(input));
  for (const secret of [
    "pw-value",
    "refresh-value",
    "hash-value",
    "bearer-value",
    "cookie-value",
    "quoted value",
    "db-value",
    "eyJhbGci",
    "access-value",
  ])
    assert.equal(output.includes(secret), false, secret);
  assert.equal(input.password, "pw-value");
});
test("cyclic data and bigint do not crash the logger", () => {
  const fields: Record<string, unknown> = { count: 1n };
  fields["self"] = fields;
  const lines: string[] = [];
  createLogger("rooms", (line) => lines.push(line)).error("failed", fields);
  assert.equal(JSON.parse(lines[0]).count, "1");
});
