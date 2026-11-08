import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { JwtVerificationService } from "./jwt-verification.service";
import { RateLimitService } from "./rate-limit.service";
import { UpstreamService } from "./upstream.service";
import { GatewayProxyMiddleware } from "./gateway-proxy.middleware";
import type { Request, Response } from "express";

describe("GatewayProxyMiddleware auth", () => {
  const jwt = {
    verifyBearer: jest.fn(),
    verifyRequired: jest.fn(),
  } as unknown as JwtVerificationService;
  const rateLimit = {
    check: jest.fn(),
  } as unknown as RateLimitService;
  const upstream = {
    baseUrl: () => "http://127.0.0.1:9",
  } as unknown as UpstreamService;

  const middleware = new GatewayProxyMiddleware(jwt, rateLimit, upstream);

  it("returns 401 when bearer required", async () => {
    (jwt.verifyRequired as jest.Mock).mockRejectedValue(
      new UnauthorizedException(),
    );

    const req = {
      method: "GET",
      path: "/api/users/me",
      originalUrl: "/api/users/me",
      header: () => undefined,
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
  });

  it("returns 403 when admin scope missing", async () => {
    (jwt.verifyRequired as jest.Mock).mockResolvedValue({
      userId: "u1",
      scopes: ["user"],
    });

    const req = {
      method: "POST",
      path: "/api/admin/movies",
      originalUrl: "/api/admin/movies",
      header: () => "Bearer x",
    } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);
    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenException));
  });
});
