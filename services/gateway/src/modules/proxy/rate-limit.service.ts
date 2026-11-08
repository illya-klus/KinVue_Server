import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { RateLimitBucket } from "./proxy.types";

type Window = { count: number; resetAt: number };

const LIMITS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  login: { max: 5, windowMs: 60_000 },
  register: { max: 3, windowMs: 60_000 },
  search: { max: 60, windowMs: 60_000 },
  rooms: { max: 30, windowMs: 60_000 },
  authenticated: { max: 300, windowMs: 60_000 },
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Window>();

  public check(bucket: RateLimitBucket, req: Request): void {
    const rule = LIMITS[bucket];
    const key = `${bucket}:${this.identity(req)}`;
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      return;
    }

    current.count += 1;
    if (current.count > rule.max) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "RATE_LIMITED",
          message: "Too many requests.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private identity(req: Request): string {
    if (req.authUserId) {
      return `user:${req.authUserId}`;
    }
    const forwarded = req.header("x-forwarded-for")?.split(",")[0]?.trim();
    return `ip:${forwarded || req.socket.remoteAddress || "unknown"}`;
  }
}
