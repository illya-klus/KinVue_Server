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

      const columns = async (table) => {
        const result = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1`,
          [table],
        );
        return Object.fromEntries(
          result.rows.map((row) => [row.column_name, row]),
        );
      };
      const identities = await columns("auth_identities");
      assert.equal(identities.user_id.data_type, "uuid");
      assert.equal(identities.email.is_nullable, "YES");
      assert.equal(identities.password_hash.is_nullable, "YES");
      assert.match(identities.status.column_default, /PENDING/);
      const identityPrimaryKey = await client.query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = 'public' AND tc.table_name = 'auth_identities'
           AND tc.constraint_type = 'PRIMARY KEY'`,
      );
      assert.deepEqual(
        identityPrimaryKey.rows.map((row) => row.column_name),
        ["user_id"],
      );

      const identityChecks = await client.query(
        `SELECT pg_get_constraintdef(oid) AS definition
         FROM pg_constraint WHERE conrelid = 'public.auth_identities'::regclass AND contype = 'c'`,
      );
      const identityCheckDefinitions = identityChecks.rows
        .map((row) => row.definition)
        .join(" ");
      for (const status of [
        "PENDING",
        "PROFILE_CREATING",
        "ACTIVE",
        "COMPENSATING",
        "COMPENSATED",
        "DISABLED",
      ]) {
        assert.ok(
          identityCheckDefinitions.includes(status),
          `Missing identity status ${status}`,
        );
      }

      const sessions = await columns("refresh_sessions");
      assert.equal(sessions.token_hash.is_nullable, "NO");
      assert.equal(sessions.rotated_from_session_id.is_nullable, "YES");
      assert.equal(sessions.revoked_at.is_nullable, "YES");
      assert.equal(sessions.expires_at.is_nullable, "NO");
      assert.ok(!Object.hasOwn(sessions, "refresh_token"));

      const sessionIndexes = await client.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'refresh_sessions'`,
      );
      const sessionIndexNames = sessionIndexes.rows.map((row) => row.indexname);
      assert.ok(sessionIndexNames.includes("refresh_sessions_user_id_idx"));
      assert.ok(sessionIndexNames.includes("refresh_sessions_expires_at_idx"));
      assert.ok(sessionIndexNames.includes("refresh_sessions_token_hash_key"));
      await client.query(
        `INSERT INTO "refresh_sessions" ("id", "user_id", "token_hash", "expires_at", "created_at", "updated_at")
         VALUES ($1, $2, 'refresh-hash', now() + interval '1 day', now(), now())`,
        [randomUUID(), randomUUID()],
      );
      await assert.rejects(
        client.query(
          `INSERT INTO "refresh_sessions" ("id", "user_id", "token_hash", "expires_at", "created_at", "updated_at")
           VALUES ($1, $2, 'refresh-hash', now() + interval '1 day', now(), now())`,
          [randomUUID(), randomUUID()],
        ),
        (error) => error.code === "23505",
      );

      const outbox = await columns("auth_outbox_events");
      assert.equal(outbox.payload.data_type, "jsonb");
      assert.equal(outbox.status.column_default, "'PENDING'::text");
      for (const column of [
        "event_id",
        "type",
        "payload",
        "status",
        "created_at",
        "published_at",
        "retry_count",
      ]) {
        assert.ok(
          Object.hasOwn(outbox, column),
          `Missing outbox column ${column}`,
        );
      }
      const outboxIndexes = await client.query(
        `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'auth_outbox_events'`,
      );
      assert.ok(
        outboxIndexes.rows.some(
          (row) => row.indexname === "auth_outbox_events_status_idx",
        ),
      );

      await client.query(
        `INSERT INTO "auth_identities" ("user_id", "email", "password_hash", "status", "created_at", "updated_at")
       VALUES ($1, $2, 'test-hash', 'PENDING', now(), now())`,
        [randomUUID(), "migration-test@example.invalid"],
      );
      await assert.rejects(
        client.query(
          `INSERT INTO "auth_identities" ("user_id", "email", "password_hash", "status", "created_at", "updated_at")
         VALUES ($1, $2, 'test-hash', 'PENDING', now(), now())`,
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
