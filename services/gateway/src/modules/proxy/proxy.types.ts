export type UpstreamName =
  | "auth"
  | "users"
  | "movie"
  | "rooms"
  | "notification";

export type AuthPolicy = "public" | "required" | "admin";

export type RateLimitBucket =
  "login" | "register" | "search" | "rooms" | "authenticated";

export type ProxyRoute = {
  methods: string[];
  path: RegExp;
  upstream: UpstreamName;
  auth: AuthPolicy;
  rateLimit?: RateLimitBucket;
};

export type VerifiedToken = {
  userId: string;
  scopes: string[];
};
