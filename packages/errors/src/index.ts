export const HTTP_STATUS = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof HTTP_STATUS;
export interface ErrorBody {
  code: ErrorCode;
  message: string;
  requestId?: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  constructor(code: ErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }
}

/** No stack, cause, SQL error, or arbitrary thrown object crosses the API boundary. */
export function errorResponse(
  error: unknown,
  requestId?: string,
): { status: number; body: ErrorBody } {
  const known = error instanceof AppError;
  const code = known ? error.code : "INTERNAL";
  return {
    status: HTTP_STATUS[code],
    body: {
      code,
      message:
        known && code !== "INTERNAL" ? error.message : "Internal server error",
      ...(requestId ? { requestId } : {}),
    },
  };
}
