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

  it("matches authenticated scheduled-room endpoints", () => {
    expect(matchProxyRoute("POST", "/api/scheduled-rooms")?.auth).toBe(
      "required",
    );
    expect(matchProxyRoute("GET", "/api/scheduled-rooms")?.upstream).toBe(
      "rooms",
    );
    expect(matchProxyRoute("POST", "/api/scheduled-rooms/a/cancel")?.auth).toBe(
      "required",
    );
  });

  it("matches admin movie routes", () => {
    const route = matchProxyRoute("POST", "/api/admin/movies/abc/publish");
    expect(route?.auth).toBe("admin");
  });

  it("protects admin reads of drafts", () => {
    expect(matchProxyRoute("GET", "/api/admin/movies/abc")?.auth).toBe("admin");
  });

  it("skips google oauth path", () => {
    expect(matchProxyRoute("POST", "/api/auth/google")).toBeUndefined();
  });
});
