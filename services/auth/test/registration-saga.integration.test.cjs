const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { createServer } = require("node:net");
const { setTimeout: delay } = require("node:timers/promises");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { Pool, Client } = require("pg");

const authDirectory = resolve(__dirname, "..");
const containerName = `kinvue-auth-registration-test-${randomUUID().slice(0, 8)}`;
const password = randomUUID();
const dockerImage =
  process.env.AUTH_TEST_POSTGRES_IMAGE || "postgres:16-alpine";

function docker(args) {
  return spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
  });
}

async function freePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}

test(
  "registration saga persists success, lost-response retry, duplicate email and compensation states",
  { timeout: 120_000 },
  async (t) => {
    const port = await freePort();
    const databaseUrl = `postgresql://kinvue:${password}@127.0.0.1:${port}/kinvue`;
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
    if (started.status !== 0) {
      if (
        /failed to connect to the docker API|docker daemon is not running/i.test(
          started.stderr,
        )
      ) {
        t.skip("Docker daemon is unavailable in this environment");
        return;
      }
      assert.equal(started.status, 0, `PostgreSQL failed: ${started.stderr}`);
    }

    let client;
    let pool;
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
        { cwd: authDirectory, env: migrationEnvironment, encoding: "utf8" },
      );
      assert.equal(
        migration.status,
        0,
        `Auth migration failed: ${migration.stdout}\n${migration.stderr}`,
      );

      const [
        { AuthIdentityRepository },
        { RegistrationSagaService },
        { ServiceUnavailableException },
      ] = await Promise.all([
        import("../dist/modules/auth/auth-identity.repository.js"),
        import("../dist/modules/auth/registration-saga.service.js"),
        import("@nestjs/common"),
      ]);
      pool = new Pool({ connectionString: databaseUrl });
      const repository = new AuthIdentityRepository({ pool });
      const profileStore = new Set();
      let mode = "success";
      let profileAttempts = [];
      const users = {
        async createProfile(input) {
          profileAttempts.push(input.userId);
          if (mode === "unavailable") throw new ServiceUnavailableException();
          profileStore.add(input.userId);
          if (mode === "lost-response" && profileAttempts.length === 1) {
            throw new ServiceUnavailableException();
          }
        },
      };
      const saga = new RegistrationSagaService(
        repository,
        {
          async hashPassword(value) {
            return `test-hash:${value}`;
          },
        },
        users,
        async () => {},
      );
      const register = (email, username) =>
        saga.register({
          email,
          username,
          displayName: username,
          password: "test-password-value",
        });
      const state = async (userId) => {
        const result = await pool.query(
          "SELECT user_id, email, password_hash, status FROM public.auth_identities WHERE user_id = $1",
          [userId],
        );
        return result.rows[0];
      };
      let successfulUserId;

      await t.test("successful profile creation reaches ACTIVE", async () => {
        mode = "success";
        const result = await register("success@example.com", "success_user");
        successfulUserId = result.userId;
        const row = await state(result.userId);
        assert.equal(result.status, "ACTIVE");
        assert.equal(row.status, "ACTIVE");
        assert.equal(row.email, "success@example.com");
        assert.equal(row.password_hash, "test-hash:test-password-value");
        assert.ok(profileStore.has(result.userId));
      });

      await t.test(
        "operator command grants admin only for the active identity",
        async () => {
          const { grantAdmin } = await import("../scripts/grant-admin.mjs");
          await grantAdmin(pool, successfulUserId);
          const result = await pool.query(
            `SELECT "role", "provider" FROM public."authUser" WHERE "id" = $1`,
            [successfulUserId],
          );
          assert.deepEqual(result.rows[0], {
            role: "ADMIN",
            provider: "PASSWORD",
          });
        },
      );

      await t.test(
        "lost Users response retries idempotently with the same user ID",
        async () => {
          mode = "lost-response";
          profileAttempts = [];
          const result = await register(
            "lost-response@example.com",
            "retry_user",
          );
          const row = await state(result.userId);
          assert.equal(profileAttempts.length, 2);
          assert.equal(new Set(profileAttempts).size, 1);
          assert.equal(row.status, "ACTIVE");
          assert.equal(profileStore.has(result.userId), true);
        },
      );

      await t.test(
        "duplicate email is 409 and leaves the existing row unchanged",
        async () => {
          mode = "success";
          const before = await pool.query(
            "SELECT user_id FROM public.auth_identities WHERE email = $1",
            ["success@example.com"],
          );
          await assert.rejects(
            register("success@example.com", "duplicate_user"),
            { status: 409 },
          );
          const after = await pool.query(
            "SELECT user_id FROM public.auth_identities WHERE email = $1",
            ["success@example.com"],
          );
          assert.equal(before.rows.length, 1);
          assert.deepEqual(after.rows, before.rows);
        },
      );

      await t.test(
        "three unavailable responses compensate and release credentials",
        async () => {
          mode = "unavailable";
          profileAttempts = [];
          await assert.rejects(
            register("unavailable@example.com", "offline_user"),
            { status: 503 },
          );
          assert.equal(profileAttempts.length, 3);
          assert.equal(new Set(profileAttempts).size, 1);
          const row = await state(profileAttempts[0]);
          assert.equal(row.status, "COMPENSATED");
          assert.equal(row.email, null);
          assert.equal(row.password_hash, null);
        },
      );
    } finally {
      await pool?.end();
      await client?.end().catch(() => {});
      docker(["stop", containerName]);
    }
  },
);
