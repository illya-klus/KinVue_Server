import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const incomingReqId = req.header("x-request-id");
    const requestId = incomingReqId?.trim() || randomUUID();

    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);

    next();
  }
}
