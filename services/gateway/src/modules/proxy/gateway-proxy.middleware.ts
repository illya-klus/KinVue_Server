import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import type { ClientRequest, IncomingMessage } from "http";
import { matchProxyRoute } from "./proxy-routes";
import { resolveRateLimitBucket } from "./rate-limit-bucket";
import { JwtVerificationService } from "./jwt-verification.service";
import { RateLimitService } from "./rate-limit.service";
import { UpstreamService } from "./upstream.service";
import { sendUpstreamUnavailable } from "./upstream-unavailable";

@Injectable()
export class GatewayProxyMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtVerificationService,
    private readonly rateLimit: RateLimitService,
    private readonly upstream: UpstreamService,
  ) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === "POST" && req.path === "/api/auth/google") {
      next();
      return;
    }

    const route = matchProxyRoute(req.method, req.path);
    if (!route) {
      next();
      return;
    }

    void this.handle(req, res, route).catch((error) => next(error));
  }

  private async handle(
    req: Request,
    res: Response,
    route: NonNullable<ReturnType<typeof matchProxyRoute>>,
  ): Promise<void> {
    let verified = await this.jwt.verifyBearer(req.header("authorization"));

    if (route.auth === "required") {
      verified = await this.jwt.verifyRequired(req.header("authorization"));
    } else if (route.auth === "admin") {
      verified = await this.jwt.verifyRequired(req.header("authorization"));
      if (!verified.scopes.includes("admin")) {
        throw new ForbiddenException({
          statusCode: 403,
          error: "FORBIDDEN",
          message: "Admin scope required.",
        });
      }
    }

    if (verified) {
      req.authUserId = verified.userId;
      req.authScopes = verified.scopes;
    }

    const bucket = resolveRateLimitBucket(req.method, req.path, route);
    if (bucket) {
      this.rateLimit.check(bucket, req);
    }

    const target = this.upstream.baseUrl(route.upstream);
    const upstreamPath = req.originalUrl.replace(/^\/api/, "") || "/";

    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: () => upstreamPath,
      on: {
        proxyReq: (proxyReq: ClientRequest, incoming: IncomingMessage) => {
          fixRequestBody(proxyReq, incoming as Request);
          const r = incoming as Request;
          proxyReq.setHeader("x-request-id", r.requestId);
          proxyReq.removeHeader("x-user-id");
          proxyReq.removeHeader("x-user-scopes");
          if (r.authUserId) {
            proxyReq.setHeader("x-user-id", r.authUserId);
          }
          if (r.authScopes?.length) {
            proxyReq.setHeader("x-user-scopes", r.authScopes.join(" "));
          }
        },
        error: (_error, _req, response) => {
          sendUpstreamUnavailable(response as Response);
        },
      },
    });

    await new Promise<void>((resolve, reject) => {
      proxy(req, res, (error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
