import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  cleanPostgres,
  cleanMongo,
  cleanRedis,
  testRedisPrefix,
  userFixture,
  movieFixture,
  httpClient,
} from "../src/index.ts";

test("cleanup refuses production and non-test databases before any I/O", async () => {
  const previous = process.env.NODE_ENV;
  let calls = 0;
  const pg = {
    async query() {
      calls++;
      return { rows: [] };
    },
  };
  const mongo = {
    databaseName: "kinvue",
    listCollections() {
      calls++;
      return {
        async toArray() {
          return [];
        },
      };
    },
    collection() {
      return {
        async deleteMany() {
          calls++;
        },
      };
    },
  };
  const redis = {
    async scan(): Promise<[string, string[]]> {
      calls++;
      return ["0", []];
    },
    async del() {
      calls++;
    },
  };
  try {
    process.env.NODE_ENV = "production";
    await assert.rejects(cleanPostgres(pg, "kinvue_test"));
    await assert.rejects(cleanMongo(mongo, "kinvue_test"));
    await assert.rejects(cleanRedis(redis, "test:run:"));
    process.env.NODE_ENV = "test";
    await assert.rejects(cleanPostgres(pg, "kinvue"));
    await assert.rejects(cleanMongo(mongo, "kinvue"));
    await assert.rejects(cleanRedis(redis, "*"));
    assert.equal(calls, 0);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
test("Postgres verifies the actual connected database, rolls back on mismatch", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  const commands: string[] = [];
  try {
    await assert.rejects(
      cleanPostgres(
        {
          async query(sql) {
            commands.push(sql);
            return { rows: [{ name: "production" }] };
          },
        },
        "kinvue_test",
      ),
    );
    assert.equal(
      commands.some((sql) => sql.startsWith("TRUNCATE")),
      false,
    );
    assert.equal(commands.at(-1), "ROLLBACK");
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
test("Postgres quotes names, preserves migration metadata and never uses CASCADE", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  const commands: string[] = [];
  try {
    await cleanPostgres(
      {
        async query(sql) {
          commands.push(sql);
          return {
            rows: sql.startsWith("SELECT current")
              ? [{ name: "kinvue_test" }]
              : sql.startsWith("SELECT tablename")
                ? [{ tablename: 'odd"table' }]
                : [],
          };
        },
      },
      "kinvue_test",
    );
    assert.ok(
      commands.includes(
        'TRUNCATE TABLE "public"."odd""table" RESTART IDENTITY',
      ),
    );
    assert.equal(
      commands.some((sql) => sql.includes("CASCADE")),
      false,
    );
    assert.equal(commands.at(-1), "COMMIT");
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
test("Redis cleanup paginates and deletes only this run's prefix", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  const deleted: string[] = [];
  let page = 0;
  try {
    await cleanRedis(
      {
        async scan(cursor, match, pattern): Promise<[string, string[]]> {
          assert.equal(pattern, "test:run:*");
          assert.equal(match, "MATCH");
          return page++ === 0
            ? ["42", ["test:run:one", "production:one", "test:other:one"]]
            : ["0", ["test:run:two"]];
        },
        async del(...keys) {
          deleted.push(...keys);
        },
      },
      testRedisPrefix("run"),
    );
    assert.deepEqual(deleted, ["test:run:one", "test:run:two"]);
    assert.throws(() => testRedisPrefix("*"));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
test("fixtures produce unique identities and films", () => {
  const users = Array.from({ length: 100 }, userFixture);
  assert.equal(new Set(users.map((user) => user.email)).size, 100);
  assert.equal(new Set(users.map((user) => user.username)).size, 100);
  assert.notEqual(movieFixture().movieId, movieFixture().movieId);
});

test("Mongo cleanup checks the connected database and preserves system collections", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  const deleted: string[] = [];
  const db = {
    databaseName: "kinvue_test",
    listCollections() {
      return {
        async toArray() {
          return [{ name: "users" }, { name: "system.views" }];
        },
      };
    },
    collection(name: string) {
      return {
        async deleteMany() {
          deleted.push(name);
        },
      };
    },
  };
  try {
    await assert.rejects(
      cleanMongo({ ...db, databaseName: "kinvue" }, "kinvue_test"),
    );
    assert.deepEqual(deleted, []);
    await cleanMongo(db, "kinvue_test");
    assert.deepEqual(deleted, ["users"]);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
test("HTTP helper sends JSON and refuses off-origin paths and redirects", async () => {
  const server = createServer((req, res) => {
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "http://example.com" });
      res.end();
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          method: req.method,
          body: JSON.parse(body || "null"),
          auth: req.headers.authorization,
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const request = httpClient(`http://127.0.0.1:${address.port}`, {
      token: "test-token",
    });
    const response = await request("/login", {
      method: "POST",
      json: { user: "test" },
    });
    assert.deepEqual(await response.json(), {
      method: "POST",
      body: { user: "test" },
      auth: "Bearer test-token",
    });
    await assert.rejects(request("https://example.com"));
    await assert.rejects(request("/redirect"));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
