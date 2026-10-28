import { base, url } from "./base.ts";
export const usersConfigSchema = base.extend({
  USERS_MONGO_URL: url(["mongodb:", "mongodb+srv:"]),
});
