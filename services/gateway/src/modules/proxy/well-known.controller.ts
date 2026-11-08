import {
  Controller,
  Get,
  Req,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { UpstreamService } from "./upstream.service";

@Controller(".well-known")
export class WellKnownController {
  constructor(private readonly upstream: UpstreamService) {}

  @Get("jwks.json")
  public jwks(@Req() req: Request, @Res() res: Response): void {
    const target = this.upstream.baseUrl("auth");
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: () => {
          throw new ServiceUnavailableException({
            statusCode: 503,
            error: "SERVICE_UNAVAILABLE",
            message: "Auth JWKS unavailable.",
          });
        },
      },
    });

    proxy(req, res, () => {
      if (!res.headersSent) {
        res.status(503).json({
          statusCode: 503,
          error: "SERVICE_UNAVAILABLE",
          message: "Auth JWKS unavailable.",
        });
      }
    });
  }
}
