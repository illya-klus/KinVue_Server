import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  HTTP_STATUS,
  errorResponse,
  type ErrorCode,
} from "../src/index.ts";

test("every API error has its specified status", () => {
  const expected = {
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    VALIDATION_FAILED: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMITED: 429,
    UPSTREAM_UNAVAILABLE: 503,
    INTERNAL: 500,
  };
  assert.deepEqual(HTTP_STATUS, expected);
  for (const [code, status] of Object.entries(expected)) {
    const result = errorResponse(
      new AppError(code as ErrorCode, "Safe message"),
      "req-1",
    );
    assert.equal(result.status, status);
    assert.equal(result.body.code, code);
    assert.equal(result.body.requestId, "req-1");
    assert.equal("stack" in result.body, false);
  }
});
test("unexpected errors and INTERNAL details never reach the caller", () => {
  for (const error of [
    new Error("postgres://secret"),
    new AppError("INTERNAL", "password=secret"),
    { message: "leak" },
    null,
  ]) {
    assert.deepEqual(errorResponse(error), {
      status: 500,
      body: { code: "INTERNAL", message: "Internal server error" },
    });
  }
});
