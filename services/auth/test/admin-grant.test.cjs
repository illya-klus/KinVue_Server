const assert = require("node:assert/strict");
const { test } = require("node:test");

test("admin grant is an operator command scoped to ACTIVE identities", async () => {
  const { grantAdmin } = await import("../scripts/grant-admin.mjs");
  const queries = [];
  const client = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes("SELECT user_id, email")) {
        return {
          rows: [
            {
              user_id: "c4c58b22-e485-44d5-8802-813c68aeb0b7",
              email: "admin@example.com",
            },
          ],
        };
      }
      if (sql.includes('INSERT INTO public."authUser"')) {
        return { rowCount: 1, rows: [{ id: values[0] }] };
      }
      return { rowCount: null, rows: [] };
    },
    release() {},
  };

  const granted = await grantAdmin(
    {
      async connect() {
        return client;
      },
    },
    "c4c58b22-e485-44d5-8802-813c68aeb0b7",
  );

  assert.equal(granted, "c4c58b22-e485-44d5-8802-813c68aeb0b7");
  assert.equal(queries[0].sql, "BEGIN");
  assert.match(queries[1].sql, /status = 'ACTIVE'/);
  assert.match(queries[2].sql, /'ADMIN', 'PASSWORD'/);
  assert.equal(queries[3].sql, "COMMIT");
});

test("admin grant rejects a non-ACTIVE identity without writing role", async () => {
  const { grantAdmin } = await import("../scripts/grant-admin.mjs");
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes("SELECT user_id, email")) return { rows: [] };
      return { rowCount: null, rows: [] };
    },
    release() {},
  };

  await assert.rejects(
    grantAdmin(
      {
        async connect() {
          return client;
        },
      },
      "c4c58b22-e485-44d5-8802-813c68aeb0b7",
    ),
    /Only an ACTIVE identity/,
  );
  assert.ok(queries.includes("ROLLBACK"));
  assert.equal(
    queries.some((sql) => sql.includes("INSERT INTO")),
    false,
  );
});

test("login role lookup grants ADMIN only to an AuthUser with ADMIN role", async () => {
  const { AuthService } = await import("../dist/modules/auth/auth.service.js");
  const service = new AuthService(
    {},
    {
      db: {
        orm: {
          public: {
            AuthUser: {
              async first() {
                return { id: "user-id", role: "ADMIN" };
              },
            },
          },
        },
      },
    },
  );

  assert.equal(await service.roleForIdentity("user-id"), "ADMIN");
});

test("ADMIN access tokens carry the admin scope", async () => {
  const { TokensService } =
    await import("../dist/modules/tokens/tokens.service.js");
  let accessPayload;
  const service = new TokensService(
    { getOrThrow: () => "test-secret" },
    {
      async signAsync(payload) {
        if (payload.scopes) accessPayload = payload;
        return "signed-token";
      },
    },
    {
      db: {
        orm: {
          public: {
            RefreshSession: { async create() {} },
          },
        },
      },
    },
    {},
  );

  await service.createTokenPair("user-id", "ADMIN");

  assert.deepEqual(accessPayload.scopes, ["admin"]);
});
