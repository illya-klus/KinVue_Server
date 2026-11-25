import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestsLoggerMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startedAt;
      process.stdout.write(
        `${JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          event: "http_request",
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
        })}\n`,
      );
    });

    next();
  }
}
