import { randomUUID } from "node:crypto";

/** Test database names must start test_ or end _test. Cleanup requires NODE_ENV=test. */
export function assertTestDatabase(database: string): void {
  if (
    process.env.NODE_ENV !== "test" ||
    !/^(?:test_[a-z0-9_]+|[a-z0-9_]+_test)$/i.test(database)
  ) {
    throw new Error(
      "Cleanup requires NODE_ENV=test and a dedicated test_*/ *_test database",
    );
  }
}
const identifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

export interface PostgresTestClient {
  query(
    sql: string,
    parameters?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

/** Use a dedicated pg Client, never a Pool: the lock/transaction must share a connection. */
export async function cleanPostgres(
  client: PostgresTestClient,
  expectedDatabase: string,
  schema = "public",
): Promise<void> {
  assertTestDatabase(expectedDatabase);
  if (
    schema !== "public" &&
    !/^(test_[a-z0-9_]+|[a-z0-9_]+_test)$/i.test(schema)
  )
    throw new Error("Invalid test schema");
  await client.query("BEGIN");
  try {
    const actual = await client.query("SELECT current_database() AS name");
    if (actual.rows[0]?.name !== expectedDatabase)
      throw new Error("Connected database does not match test database");
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename NOT IN ('_prisma_migrations', 'schema_migrations')",
      [schema],
    );
    // No CASCADE: refuse to truncate if it would cross this explicit table set.
    const names = tables.rows.map(
      (row) => `${identifier(schema)}.${identifier(String(row.tablename))}`,
    );
    if (names.length)
      await client.query(`TRUNCATE TABLE ${names.join(", ")} RESTART IDENTITY`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export interface MongoTestDatabase {
  databaseName: string;
  listCollections(
    filter: object,
    options: { nameOnly: true },
  ): { toArray(): Promise<{ name: string }[]> };
  collection(name: string): { deleteMany(filter: object): Promise<unknown> };
}
/** Keep indexes: remove documents rather than dropping collections. */
export async function cleanMongo(
  db: MongoTestDatabase,
  expectedDatabase: string,
): Promise<void> {
  assertTestDatabase(expectedDatabase);
  if (db.databaseName !== expectedDatabase)
    throw new Error("Connected database does not match test database");
  const collections = await db
    .listCollections({}, { nameOnly: true })
    .toArray();
  for (const { name } of collections)
    if (!name.startsWith("system.")) await db.collection(name).deleteMany({});
}

export interface RedisTestClient {
  scan(
    cursor: string,
    match: "MATCH",
    pattern: string,
    count: "COUNT",
    limit: number,
  ): Promise<[string, string[]]>;
  del(...keys: string[]): Promise<unknown>;
}
/** ioredis-compatible client. Every test run owns test:<run-id>:; FLUSHDB is forbidden. */
export function testRedisPrefix(runId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(runId))
    throw new Error("Invalid test run id");
  return `test:${runId}:`;
}
export async function cleanRedis(
  client: RedisTestClient,
  prefix: string,
): Promise<void> {
  if (
    process.env.NODE_ENV !== "test" ||
    !/^test:[a-zA-Z0-9_-]{1,100}:$/.test(prefix)
  )
    throw new Error("Invalid test Redis scope");
  let cursor = "0";
  do {
    const page = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
    cursor = page[0];
    const keys = page[1].filter((key) => key.startsWith(prefix));
    if (keys.length) await client.del(...keys);
  } while (cursor !== "0");
}

export function userFixture() {
  const suffix = randomUUID().replaceAll("-", "");
  return {
    userId: randomUUID(),
    email: `test-${suffix}@example.test`,
    username: `test_${suffix.slice(0, 24)}`,
    displayName: "Test User",
  };
}
export function movieFixture() {
  return {
    movieId: randomUUID(),
    title: `Test movie ${randomUUID()}`,
    description: "Integration fixture",
    genres: ["drama"],
    durationSeconds: 120,
    posterKey: "posters/test.jpg",
  };
}

/** Only relative paths on the supplied origin are accepted. No credential forwarding redirects. */
export function httpClient(
  baseUrl: string,
  defaults: { token?: string; timeoutMs?: number } = {},
) {
  const base = new URL(baseUrl);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid HTTP base URL");
  return async (
    path: string,
    options: {
      method?: string;
      json?: unknown;
      headers?: Record<string, string>;
    } = {},
  ) => {
    const target = new URL(path, base);
    if (target.origin !== base.origin || target.username || target.password)
      throw new Error("HTTP helper cannot leave its base origin");
    return fetch(target, {
      method: options.method ?? "GET",
      headers: {
        ...(options.json === undefined
          ? {}
          : { "content-type": "application/json" }),
        ...(defaults.token
          ? { authorization: `Bearer ${defaults.token}` }
          : {}),
        ...options.headers,
      },
      ...(options.json === undefined
        ? {}
        : { body: JSON.stringify(options.json) }),
      signal: AbortSignal.timeout(defaults.timeoutMs ?? 5000),
      redirect: "error",
    });
  };
}
