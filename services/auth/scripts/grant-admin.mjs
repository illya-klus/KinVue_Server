import "dotenv/config";
import { Pool } from "pg";
import { pathToFileURL } from "node:url";

function validateDatabaseUrl(value) {
  if (!value) throw new Error("AUTH_DATABASE_URL or DATABASE_URL is required");
  const url = new URL(value);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.pathname !== "/kinvue"
  ) {
    throw new Error(
      "Admin command is restricted to the PostgreSQL kinvue database",
    );
  }
  return url.toString();
}

export async function grantAdmin(pool, userId) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(userId)) {
    throw new Error("--user-id must be a UUID");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const identity = await client.query(
      `SELECT user_id, email
       FROM public.auth_identities
       WHERE user_id = $1 AND status = 'ACTIVE'
       FOR UPDATE`,
      [userId],
    );
    const active = identity.rows[0];
    if (!active)
      throw new Error("Only an ACTIVE identity can be granted admin");

    const result = await client.query(
      `INSERT INTO public."authUser" AS existing
         ("id", "email", "role", "provider", "providerUserId", "createdAt", "updatedAt")
       VALUES ($1, $2, 'ADMIN', 'PASSWORD', $1, NOW(), NOW())
       ON CONFLICT ("id") DO UPDATE
         SET "email" = EXCLUDED."email", "role" = 'ADMIN', "updatedAt" = NOW()
         WHERE existing."provider" = 'PASSWORD'
       RETURNING "id"`,
      [active.user_id, active.email],
    );
    if (result.rowCount !== 1) {
      throw new Error("Existing AuthUser is not a password identity");
    }

    await client.query("COMMIT");
    return active.user_id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const idIndex = args.indexOf("--user-id");
  const userId = idIndex >= 0 ? args[idIndex + 1] : undefined;
  if (!userId)
    throw new Error(
      "Usage: pnpm --filter @kinvue/auth admin:grant -- --user-id <uuid>",
    );

  const connectionString = validateDatabaseUrl(
    process.env["AUTH_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  );
  const pool = new Pool({ connectionString });
  try {
    const grantedUserId = await grantAdmin(pool, userId);
    process.stdout.write(`Admin granted to ACTIVE identity ${grantedUserId}\n`);
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Admin grant failed"}\n`,
    );
    process.exitCode = 1;
  });
}
