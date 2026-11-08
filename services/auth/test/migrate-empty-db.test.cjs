const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { Client } = require("pg");
const { resolve } = require("node:path");
const { randomUUID } = require("node:crypto");

const authDirectory = resolve(__dirname, "..");
const dockerImage =
  process.env.AUTH_TEST_POSTGRES_IMAGE || "postgres:16-alpine";
const port = Number(process.env.AUTH_TEST_PORT || 5433);
const containerName = `kinvue-auth-migration-test-${randomUUID().slice(0, 8)}`;
const password = randomUUID();
const databaseUrl = `postgresql://kinvue:${password}@127.0.0.1:${port}/kinvue`;

function docker(args) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result;
}

test(
  "applies Auth migrations to an empty PostgreSQL database",
  { timeout: 90_000 },
  async () => {
    const started = docker([
      "run",
      "--detach",
      "--rm",
      "--name",
      containerName,
      "--env",
      "POSTGRES_USER=kinvue",
      "--env",
      `POSTGRES_PASSWORD=${password}`,
      "--env",
      "POSTGRES_DB=kinvue",
      "--publish",
      `127.0.0.1:${port}:5432`,
      dockerImage,
    ]);
    assert.equal(
      started.status,
      0,
      `Could not start test PostgreSQL: ${started.stderr}`,
    );

    let client;
    try {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        client = new Client({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 1000,
        });
        try {
          await client.connect();
          break;
        } catch {
          await client.end().catch(() => {});
          client = undefined;
          await delay(500);
        }
      }
      assert.ok(client, "Test PostgreSQL did not become ready");

      const migrationEnvironment = {
        ...process.env,
        AUTH_DATABASE_URL: databaseUrl,
      };
      delete migrationEnvironment.DATABASE_URL;
      const migration = spawnSync(
        process.execPath,
        [resolve(authDirectory, "scripts/migrate-auth.mjs")],
        {
          cwd: authDirectory,
          env: migrationEnvironment,
          encoding: "utf8",
          windowsHide: true,
        },
      );
      assert.equal(
        migration.status,
        0,
        `Auth migration failed: ${migration.stderr || migration.stdout}`,
      );

      await client.query(
        `INSERT INTO "authUser" ("id", "email", "role", "provider", "providerUserId", "createdAt", "updatedAt")
       VALUES ($1, $2, 'USER', 'test', 'provider-one', now(), now())`,
        [randomUUID(), "migration-test@example.invalid"],
      );
      await assert.rejects(
        client.query(
          `INSERT INTO "authUser" ("id", "email", "role", "provider", "providerUserId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'USER', 'test', 'provider-two', now(), now())`,
          [randomUUID(), "migration-test@example.invalid"],
        ),
        (error) => error.code === "23505",
      );
      await client.end();
    } finally {
      await client?.end().catch(() => {});
      docker(["stop", containerName]);
    }
  },
);
