import { HttpException } from "@nestjs/common";
import type { Request } from "express";
import { RateLimitService } from "./rate-limit.service";

describe("RateLimitService", () => {
  const service = new RateLimitService();

  const req = (ip = "1.2.3.4") =>
    ({
      authUserId: undefined,
      header: () => undefined,
      socket: { remoteAddress: ip },
    }) as unknown as Request;

  it("allows until limit exceeded", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(() => service.check("login", req())).not.toThrow();
    }
    expect(() => service.check("login", req())).toThrow(HttpException);
  });
});
