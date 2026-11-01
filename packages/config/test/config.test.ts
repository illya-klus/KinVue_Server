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
  usersConfigSchema,
  movieConfigSchema,
  z,
} from "../src/index.ts";

test("all eight service schemas reject missing required configuration", () => {
  assert.equal(Object.keys(serviceSchemas).length, 8);
  for (const schema of Object.values(serviceSchemas))
    assert.throws(() => loadConfig(schema, {}), ConfigError);
});

test("Users and Movie diagnostics have distinct ports and reject invalid overrides", () => {
  const users = { USERS_MONGO_URL: "mongodb://localhost/kinvue_users" };
  const movie = {
    MOVIE_DATABASE_URL: "postgresql://user:password@localhost/kinvue_movies",
    MEILISEARCH_HOST: "http://localhost:7700",
    MEILISEARCH_MASTER_KEY: "test-key",
  };
  assert.equal(loadConfig(usersConfigSchema, users).USERS_HTTP_PORT, 4002);
  assert.equal(loadConfig(movieConfigSchema, movie).MOVIE_HTTP_PORT, 4003);
  assert.equal(
    loadConfig(usersConfigSchema, users).USERS_HTTP_HOST,
    "127.0.0.1",
  );
  assert.equal(
    loadConfig(movieConfigSchema, movie).MOVIE_HTTP_HOST,
    "127.0.0.1",
  );
  assert.equal(
    loadConfig(usersConfigSchema, { ...users, USERS_HTTP_PORT: "4102" })
      .USERS_HTTP_PORT,
    4102,
  );
  for (const invalid of ["0", "65536", "", "1.5"]) {
    assert.throws(
      () =>
        loadConfig(usersConfigSchema, { ...users, USERS_HTTP_PORT: invalid }),
      ConfigError,
    );
    assert.throws(
      () =>
        loadConfig(movieConfigSchema, { ...movie, MOVIE_HTTP_PORT: invalid }),
      ConfigError,
    );
  }
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
