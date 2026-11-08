import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const authDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function validateAuthDatabaseUrl(value) {
  if (!value) throw new Error("AUTH_DATABASE_URL is required");

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("AUTH_DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("AUTH_DATABASE_URL must use PostgreSQL");
  }
  if (decodeURIComponent(url.pathname.slice(1)) !== "kinvue") {
    throw new Error("Auth migrations are restricted to the kinvue database");
  }
  return url;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let databaseUrl;
  try {
    databaseUrl = validateAuthDatabaseUrl(process.env.AUTH_DATABASE_URL).href;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }

  if (databaseUrl) {
    const prismaCli = resolve(
      authDirectory,
      "node_modules/prisma/dist/prisma.js",
    );
    const result = spawnSync(
      process.execPath,
      [prismaCli, "db", "migrate", "--db", databaseUrl],
      { cwd: authDirectory, env: process.env, stdio: "inherit" },
    );
    if (result.error) {
      console.error("Could not start Prisma migration runner");
      process.exitCode = 1;
    } else {
      process.exitCode = result.status ?? 1;
    }
  }
}
