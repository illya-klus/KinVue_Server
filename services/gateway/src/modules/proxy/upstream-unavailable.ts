import type { Response } from "express";

export const UPSTREAM_UNAVAILABLE_BODY = {
  statusCode: 503,
  error: "SERVICE_UNAVAILABLE",
  message: "Upstream service unavailable.",
} as const;

export function sendUpstreamUnavailable(response: Response): void {
  if (!response.headersSent) {
    response.status(503).json(UPSTREAM_UNAVAILABLE_BODY);
  }
}
