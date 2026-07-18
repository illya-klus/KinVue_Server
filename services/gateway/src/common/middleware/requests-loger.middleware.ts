import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestsLoggerMiddleware implements NestMiddleware {
  private readonly logger = Logger;

  public use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startedAt;
      this.logger.log(
        `[${req.requestId}] ${req.method} ${req.originalUrl} ` +
          `${res.statusCode} ${duration}ms`,
      );
    });

    next();
  }
}
