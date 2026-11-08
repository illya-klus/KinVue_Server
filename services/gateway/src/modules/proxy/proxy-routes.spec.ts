import { matchProxyRoute } from "./proxy-routes";

describe("matchProxyRoute", () => {
  it("matches public movie search", () => {
    const route = matchProxyRoute("GET", "/api/movies/search?q=test");
    expect(route?.upstream).toBe("movie");
    expect(route?.auth).toBe("public");
  });

  it("matches authenticated watchlist", () => {
    const route = matchProxyRoute("GET", "/api/watchlist");
    expect(route?.auth).toBe("required");
  });

  it("matches admin movie routes", () => {
    const route = matchProxyRoute("POST", "/api/admin/movies/abc/publish");
    expect(route?.auth).toBe("admin");
  });

  it("skips google oauth path", () => {
    expect(matchProxyRoute("POST", "/api/auth/google")).toBeUndefined();
  });
});
