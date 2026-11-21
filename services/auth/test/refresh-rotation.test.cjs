const assert = require("node:assert/strict");
const { test } = require("node:test");

test("refresh rotation revokes old session and creates the successor atomically", async () => {
  const { RefreshSessionRepository } =
    await import("../dist/modules/tokens/refresh-session.repository.js");
  const queries = [];
  const client = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes("UPDATE public.refresh_sessions")) {
        return { rows: [{ id: "old-session", user_id: "user-1" }] };
      }
      return { rows: [] };
    },
    release() {},
  };
  const repository = new RefreshSessionRepository({
    pool: {
      async connect() {
        return client;
      },
    },
  });

  const result = await repository.rotate("old-hash", "new-hash");

  assert.equal(result.userId, "user-1");
  assert.match(result.sessionId, /^[0-9a-f-]{36}$/i);
  assert.equal(queries[0].sql, "BEGIN");
  assert.match(queries[1].sql, /revoked_at IS NULL AND expires_at > NOW\(\)/);
  assert.match(queries[2].sql, /INTERVAL '30 days'/);
  assert.deepEqual(queries[2].values.slice(1), [
    "user-1",
    "new-hash",
    "old-session",
  ]);
  assert.equal(queries[3].sql, "COMMIT");
});

test("refresh rotation rejects replay and does not create another session", async () => {
  const { RefreshSessionRepository } =
    await import("../dist/modules/tokens/refresh-session.repository.js");
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      return { rows: [] };
    },
    release() {},
  };
  const repository = new RefreshSessionRepository({
    pool: {
      async connect() {
        return client;
      },
    },
  });

  assert.equal(await repository.rotate("replayed-hash", "new-hash"), null);
  assert.deepEqual(queries, ["BEGIN", queries[1], "ROLLBACK"]);
  assert.match(queries[1], /UPDATE public\.refresh_sessions/);
});

test("logout revokes only the matching refresh session hash", async () => {
  const { RefreshSessionRepository } =
    await import("../dist/modules/tokens/refresh-session.repository.js");
  let captured;
  const repository = new RefreshSessionRepository({
    pool: {
      async query(sql, values) {
        captured = { sql, values };
        return { rowCount: 1, rows: [] };
      },
    },
  });

  await repository.revoke("sha256-hash");

  assert.match(
    captured.sql,
    /SET revoked_at = COALESCE\(revoked_at, NOW\(\)\)/,
  );
  assert.deepEqual(captured.values, ["sha256-hash"]);
});
