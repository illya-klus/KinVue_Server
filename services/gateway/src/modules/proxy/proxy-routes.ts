import type { ProxyRoute } from "./proxy.types";

export const PROXY_ROUTES: ProxyRoute[] = [
  {
    methods: ["POST"],
    path: /^\/api\/auth\/register\/?$/,
    upstream: "auth",
    auth: "public",
    rateLimit: "register",
  },
  {
    methods: ["POST"],
    path: /^\/api\/auth\/login\/?$/,
    upstream: "auth",
    auth: "public",
    rateLimit: "login",
  },
  {
    methods: ["POST"],
    path: /^\/api\/auth\/refresh\/?$/,
    upstream: "auth",
    auth: "public",
  },
  {
    methods: ["POST"],
    path: /^\/api\/auth\/logout\/?$/,
    upstream: "auth",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["GET"],
    path: /^\/api\/movies\/search\/?$/,
    upstream: "movie",
    auth: "public",
    rateLimit: "search",
  },
  {
    methods: ["GET"],
    path: /^\/api\/movies\/[^/]+\/?$/,
    upstream: "movie",
    auth: "public",
    rateLimit: "search",
  },
  {
    methods: ["GET", "PATCH"],
    path: /^\/api\/users\/me\/?$/,
    upstream: "users",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["GET"],
    path: /^\/api\/users\/search\/?$/,
    upstream: "users",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["POST", "GET"],
    path: /^\/api\/friend-requests(\/.*)?$/,
    upstream: "users",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["GET"],
    path: /^\/api\/friends\/?$/,
    upstream: "users",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["GET", "POST", "DELETE"],
    path: /^\/api\/watchlist\/?$/,
    upstream: "movie",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["POST", "DELETE"],
    path: /^\/api\/movies\/[^/]+\/watchlist\/?$/,
    upstream: "movie",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["GET", "POST"],
    path: /^\/api\/rooms(\/.*)?$/,
    upstream: "rooms",
    auth: "required",
  },
  {
    methods: ["POST"],
    path: /^\/api\/movies\/[^/]+\/media-access\/?$/,
    upstream: "movie",
    auth: "required",
    rateLimit: "authenticated",
  },
  {
    methods: ["POST", "PATCH"],
    path: /^\/api\/admin\/movies(\/.*)?$/,
    upstream: "movie",
    auth: "admin",
    rateLimit: "authenticated",
  },
];

export function matchProxyRoute(
  method: string,
  path: string,
): ProxyRoute | undefined {
  const normalized = path.split("?")[0] ?? path;
  return PROXY_ROUTES.find(
    (route) =>
      route.methods.includes(method.toUpperCase()) &&
      route.path.test(normalized),
  );
}
