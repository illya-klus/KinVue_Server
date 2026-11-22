import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { UnauthorizedException } from "@nestjs/common";
import request from "supertest";
import { validateProxyRequestBody } from "./modules/proxy/proxy-request-validation";
import { GatewayProxyMiddleware } from "./modules/proxy/gateway-proxy.middleware";
import type { JwtVerificationService } from "./modules/proxy/jwt-verification.service";
import type { RateLimitService } from "./modules/proxy/rate-limit.service";
import type { UpstreamService } from "./modules/proxy/upstream.service";

describe("security regression cases", () => {
  it("rejects an expired bearer before proxying media-access", async () => {
    const verifyBearer = jest
      .fn()
      .mockRejectedValue(new UnauthorizedException("TOKEN_EXPIRED"));
    const baseUrl = jest.fn(() => "http://127.0.0.1:9");
    const middleware = new GatewayProxyMiddleware(
      {
        verifyBearer,
        verifyRequired: jest.fn(),
      } as unknown as JwtVerificationService,
      { check: jest.fn() } as unknown as RateLimitService,
      { baseUrl } as unknown as UpstreamService,
    );
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      Object.assign(req, { requestId: "request-1" });
      middleware.use(req, res, next);
    });
    app.use(
      (
        error: unknown,
        _req: unknown,
        res: express.Response,
        _next: unknown,
      ) => {
        const status =
          error instanceof UnauthorizedException ? error.getStatus() : 500;
        res.status(status).json({ statusCode: status });
      },
    );

    await request(app)
      .post("/api/movies/550e8400-e29b-41d4-a716-446655440000/media-access")
      .set("Authorization", "Bearer expired-token")
      .expect(401, { statusCode: 401 });

    expect(verifyBearer).toHaveBeenCalledWith("Bearer expired-token");
    expect(baseUrl).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated direct access to a private room before proxying", async () => {
    const verifyBearer = jest.fn().mockResolvedValue(undefined);
    const verifyRequired = jest
      .fn()
      .mockRejectedValue(new UnauthorizedException("AUTH_REQUIRED"));
    const baseUrl = jest.fn(() => "http://127.0.0.1:9");
    const middleware = new GatewayProxyMiddleware(
      { verifyBearer, verifyRequired } as unknown as JwtVerificationService,
      { check: jest.fn() } as unknown as RateLimitService,
      { baseUrl } as unknown as UpstreamService,
    );
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      Object.assign(req, { requestId: "request-1" });
      middleware.use(req, res, next);
    });
    app.use(
      (
        error: unknown,
        _req: unknown,
        res: express.Response,
        _next: unknown,
      ) => {
        const status =
          error instanceof UnauthorizedException ? error.getStatus() : 500;
        res.status(status).json({ statusCode: status });
      },
    );

    await request(app)
      .post("/api/rooms/550e8400-e29b-41d4-a716-446655440000/invites/accept")
      .send({ token: "private-invite-token" })
      .expect(401, { statusCode: 401 });

    expect(verifyRequired).toHaveBeenCalledWith(undefined);
    expect(baseUrl).not.toHaveBeenCalled();
  });

  it("lets a valid admin reach the protected movie upload route", async () => {
    const upstreamHeaders: Record<string, string | string[] | undefined> = {};
    const upstream = createServer((req, res) => {
      Object.assign(upstreamHeaders, req.headers);
      res.statusCode = 204;
      res.end();
    });
    await new Promise<void>((resolve) =>
      upstream.listen(0, "127.0.0.1", resolve),
    );
    const address = upstream.address() as AddressInfo;
    const verifyBearer = jest.fn().mockResolvedValue({
      userId: "admin-1",
      scopes: ["admin"],
    });
    const verifyRequired = jest.fn().mockResolvedValue({
      userId: "admin-1",
      scopes: ["admin"],
    });
    const baseUrl = jest.fn(() => `http://127.0.0.1:${address.port}`);
    const middleware = new GatewayProxyMiddleware(
      { verifyBearer, verifyRequired } as unknown as JwtVerificationService,
      { check: jest.fn() } as unknown as RateLimitService,
      { baseUrl } as unknown as UpstreamService,
    );
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      Object.assign(req, { requestId: "request-1" });
      middleware.use(req, res, next);
    });

    try {
      await request(app)
        .post(
          "/api/admin/movies/550e8400-e29b-41d4-a716-446655440000/upload/init",
        )
        .set("Authorization", "Bearer admin-token")
        .send({
          fileName: "movie.mp4",
          contentType: "video/mp4",
          fileSizeBytes: 2 * 1024 * 1024,
          partCount: 2,
        })
        .expect(204);
    } finally {
      await new Promise<void>((resolve, reject) =>
        upstream.close((error) => (error ? reject(error) : resolve())),
      );
    }

    expect(verifyRequired).toHaveBeenCalledWith("Bearer admin-token");
    expect(baseUrl).toHaveBeenCalledWith("movie");
    expect(upstreamHeaders["x-user-id"]).toBe("admin-1");
    expect(upstreamHeaders["x-user-scopes"]).toBe("admin");
  });

  it("rejects a non-video upload content type at the Gateway boundary", () => {
    const result = validateProxyRequestBody(
      "POST",
      "/api/admin/movies/550e8400-e29b-41d4-a716-446655440000/upload/init",
      {
        fileName: "movie.txt",
        contentType: "text/plain",
        fileSizeBytes: 2 * 1024 * 1024,
        partCount: 2,
      },
    );

    expect(result).toMatchObject({
      error: expect.stringContaining("contentType"),
    });
  });
});
