const { test } = require("node:test");
const assert = require("node:assert/strict");
test("Movie migration URL guard rejects Auth and other databases", async () => {
  const { validateMovieDatabaseUrl } =
    await import("../scripts/migrate-movie.mjs");
  for (const value of [
    undefined,
    "bad",
    "https://localhost/kinvue_movie",
    "postgresql://localhost/kinvue",
    "postgresql://localhost/kinvue_movies",
  ])
    assert.throws(() => validateMovieDatabaseUrl(value));
  assert.equal(
    validateMovieDatabaseUrl("postgresql://localhost:5434/kinvue_movie")
      .pathname,
    "/kinvue_movie",
  );
});
