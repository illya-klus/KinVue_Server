const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");

test("Auth migration URL is restricted to PostgreSQL kinvue database", async () => {
  const { validateAuthDatabaseUrl } = await import(
    pathToFileURL(resolve(__dirname, "../scripts/migrate-auth.mjs"))
  );
  assert.equal(
    validateAuthDatabaseUrl("postgresql://user:secret@localhost:5432/kinvue")
      .hostname,
    "localhost",
  );
  assert.throws(
    () => validateAuthDatabaseUrl(undefined),
    /AUTH_DATABASE_URL is required/,
  );
  assert.throws(
    () => validateAuthDatabaseUrl("mysql://localhost/kinvue"),
    /PostgreSQL/,
  );
  assert.throws(
    () => validateAuthDatabaseUrl("postgresql://localhost:5432/other"),
    /restricted to the kinvue database/,
  );
});
