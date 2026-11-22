import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import request from "supertest";
import { validateProxyRequestBody } from "./modules/proxy/proxy-request-validation";
import { GatewayProxyMiddleware } from "./modules/proxy/gateway-proxy.middleware";
import { JwtVerificationService } from "./modules/proxy/jwt-verification.service";
import { JwksService } from "./modules/proxy/jwks.service";
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

  it("reads the profile through Gateway with a pre-restart token and the restarted Auth JWKS", async () => {
    const issuer = "kinvue-auth";
    const audience = "kinvue";
    const kid = "persistent-auth-key";
    const userId = "e3aa40c8-3fcf-4d96-9c6a-998c31ef54c3";
    const keys = await generateKeyPair("RS256");
    const publicJwk = await exportJWK(keys.publicKey);
    const accessToken = await new SignJWT({ userId, scopes: [] })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(keys.privateKey);

    // The token was issued before the restart; the JWKS below represents the
    // key that a newly initialized Auth process loads from stable config.
    const auth = createServer((_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          keys: [{ ...publicJwk, kid, alg: "RS256", use: "sig" }],
        }),
      );
    });
    const upstreamHeaders: Record<string, string | string[] | undefined> = {};
    const users = createServer((req, res) => {
      Object.assign(upstreamHeaders, req.headers);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ id: userId, displayName: "Profile" }));
    });
    await Promise.all([
      new Promise<void>((resolve) => auth.listen(0, "127.0.0.1", resolve)),
      new Promise<void>((resolve) => users.listen(0, "127.0.0.1", resolve)),
    ]);
    const authAddress = auth.address() as AddressInfo;
    const usersAddress = users.address() as AddressInfo;
    const config = {
      getOrThrow: (key: string) => {
        if (key === "AUTH_SERVICE_URL")
          return `http://127.0.0.1:${authAddress.port}`;
        if (key === "JWT_ISSUER") return issuer;
        if (key === "JWT_AUDIENCE") return audience;
        throw new Error(`Unexpected config key: ${key}`);
      },
    } as ConfigService;
    const jwt = new JwtVerificationService(config, new JwksService(config));
    const middleware = new GatewayProxyMiddleware(
      jwt,
      { check: jest.fn() } as unknown as RateLimitService,
      {
        baseUrl: () => `http://127.0.0.1:${usersAddress.port}`,
      } as unknown as UpstreamService,
    );
    const app = express();
    app.use((req, res, next) => {
      Object.assign(req, { requestId: "request-restart-profile" });
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

    try {
      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200, { id: userId, displayName: "Profile" });
    } finally {
      await Promise.all(
        [auth, users].map(
          (server) =>
            new Promise<void>((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            ),
        ),
      );
    }

    expect(upstreamHeaders["x-user-id"]).toBe(userId);
    expect(upstreamHeaders["x-user-scopes"]).toBeUndefined();
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
