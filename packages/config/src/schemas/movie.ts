import { base, postgres, http, nonempty, port } from "./base.ts";
export const movieConfigSchema = base.extend({
  MOVIE_HTTP_PORT: port.default(4003),
  MOVIE_HTTP_HOST: nonempty.default("127.0.0.1"),
  MOVIE_DATABASE_URL: postgres,
  MEILISEARCH_HOST: http,
  MEILISEARCH_MASTER_KEY: nonempty,
  MOVIE_INTERNAL_TOKEN: nonempty.default("local-movie-internal-token"),
});
