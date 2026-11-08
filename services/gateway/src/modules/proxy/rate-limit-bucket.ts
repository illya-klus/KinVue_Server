import { matchProxyRoute } from "./proxy-routes";
import type { ProxyRoute, RateLimitBucket } from "./proxy.types";

export function resolveRateLimitBucket(
  method: string,
  path: string,
  route: ProxyRoute,
): RateLimitBucket | undefined {
  if (route.rateLimit) {
    return route.rateLimit;
  }

  const normalized = path.split("?")[0] ?? path;
  if (
    route.upstream === "rooms" &&
    method.toUpperCase() === "POST" &&
    /^\/api\/rooms\/?$/.test(normalized)
  ) {
    return "rooms";
  }

  if (route.auth === "public") {
    return undefined;
  }

  return "authenticated";
}

export function rateLimitBucketForRequest(
  method: string,
  path: string,
): RateLimitBucket | undefined {
  const route = matchProxyRoute(method, path);
  if (!route) {
    return undefined;
  }
  return resolveRateLimitBucket(method, path, route);
}
