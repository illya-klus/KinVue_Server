import { base, postgres, http, nonempty } from "./base.ts";
export const movieConfigSchema = base.extend({
  MOVIE_DATABASE_URL: postgres,
  MEILISEARCH_HOST: http,
  MEILISEARCH_MASTER_KEY: nonempty,
});
