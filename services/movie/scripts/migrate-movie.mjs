import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pg from "pg";

const directory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function validateMovieDatabaseUrl(value) {
  if (!value) throw new Error("MOVIE_DATABASE_URL is required");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid Movie database URL");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    decodeURIComponent(url.pathname.slice(1)) !== "kinvue_movie"
  ) {
    throw new Error(
      "Movie migrations are restricted to PostgreSQL database kinvue_movie",
    );
  }
  return url;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const databaseUrl = validateMovieDatabaseUrl(
      process.env.MOVIE_DATABASE_URL,
    ).href;
    const cli = resolve(directory, "node_modules/prisma/dist/prisma.js");
    const result = spawnSync(
      process.execPath,
      [cli, "db", "migrate", "--db", databaseUrl],
      {
        cwd: directory,
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
        windowsHide: true,
      },
    );
    process.exitCode = result.status ?? 1;
    if (result.status === 0) {
      const client = new pg.Client({ connectionString: databaseUrl });
      try {
        await client.connect();
        await client.query(
          "INSERT INTO movie_index_sync_state (id) VALUES ('movies') ON CONFLICT DO NOTHING",
        );
      } finally {
        await client.end();
      }
    }
  } catch (error) {
    console.error(
      error instanceof Error &&
        /required|Invalid Movie|restricted/.test(error.message)
        ? error.message
        : "Movie migrations failed; inspect the migration result without exposing credentials",
    );
    process.exitCode = 1;
  }
}
