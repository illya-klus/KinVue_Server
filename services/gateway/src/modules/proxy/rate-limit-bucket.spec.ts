import { rateLimitBucketForRequest } from "./rate-limit-bucket";

describe("rateLimitBucketForRequest", () => {
  it("uses rooms bucket only for POST /api/rooms", () => {
    expect(rateLimitBucketForRequest("POST", "/api/rooms")).toBe("rooms");
    expect(rateLimitBucketForRequest("GET", "/api/rooms/public")).toBe(
      "authenticated",
    );
  });
});
