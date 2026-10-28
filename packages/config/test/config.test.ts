import { test } from "node:test";
import assert from "node:assert/strict";
import { inspect } from "node:util";
import {
  ConfigError,
  loadConfig,
  port,
  serviceSchemas,
  authConfigSchema,
  gatewayConfigSchema,
  z,
} from "../src/index.ts";

test("all eight service schemas reject missing required configuration", () => {
  assert.equal(Object.keys(serviceSchemas).length, 8);
  for (const schema of Object.values(serviceSchemas))
    assert.throws(() => loadConfig(schema, {}), ConfigError);
});
test("invalid config never retains rejected secrets, even custom Zod messages", () => {
  const secret = "unique-secret-value";
  const schema = z.object({
    SECRET: z.string().refine(() => false, { message: secret }),
  });
  try {
    loadConfig(schema, { SECRET: secret });
    assert.fail();
  } catch (error) {
    assert.ok(error instanceof ConfigError);
    assert.equal(inspect(error).includes(secret), false);
    assert.equal(JSON.stringify(error).includes(secret), false);
    assert.deepEqual(error.fields, ["SECRET"]);
  }
});
test("ports reject empty, zero, out-of-range and fractional values", () => {
  for (const value of ["", "0", "65536", "2.5", "abc", undefined])
    assert.equal(port.safeParse(value).success, false);
  assert.equal(port.parse("4001"), 4001);
});
test("auth validates database protocol and gateway parses CORS origins", () => {
  const env = {
    DATABASE_URL: "postgresql://user:password@localhost/kinvue",
    GOOGLE_CLIENT_ID: "google",
    JWT_ACCESS_SECRET: "test-access",
    JWT_REFRESH_SECRET: "test-refresh",
  };
  assert.equal(
    loadConfig(authConfigSchema, env).AUTH_GRPC_URL,
    "0.0.0.0:50051",
  );
  assert.throws(
    () =>
      loadConfig(authConfigSchema, {
        ...env,
        DATABASE_URL: "https://localhost/db",
      }),
    ConfigError,
  );
  assert.deepEqual(
    loadConfig(gatewayConfigSchema, {
      PORT: "3000",
      ORIGINS: "http://localhost:5173, https://kinvue.example",
    }).ORIGINS,
    ["http://localhost:5173", "https://kinvue.example"],
  );
  assert.throws(
    () =>
      loadConfig(gatewayConfigSchema, {
        PORT: "3000",
        ORIGINS: "http://localhost:5173,",
      }),
    ConfigError,
  );
});
