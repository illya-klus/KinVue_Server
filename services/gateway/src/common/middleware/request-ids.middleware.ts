import { Injectable, NestMiddleware } from "@nestjs/common";
import { writeSync } from "node:fs";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const incomingReqId = req.header("x-request-id")?.trim();
    const requestId =
      incomingReqId && /^[\w.-]{1,128}$/.test(incomingReqId)
        ? incomingReqId
        : randomUUID();

    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    writeSync(
      1,
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "http_request_started",
        requestId,
        method: req.method,
        path: req.originalUrl,
      })}\n`,
    );

    next();
  }
}
