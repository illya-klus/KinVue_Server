import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
const connection = process.env["MOVIE_DATABASE_URL"];
if (connection) {
  let valid = false;
  try {
    const url = new URL(connection);
    valid =
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      decodeURIComponent(url.pathname.slice(1)) === "kinvue_movie";
  } catch {
    /* Report only configuration field names. */
  }
  if (!valid)
    throw new Error(
      "MOVIE_DATABASE_URL must target PostgreSQL database kinvue_movie",
    );
}

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: connection!,
    },
  }),
});
