import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { AppError, errorResponse } from "@kinvue/errors";

@Catch()
export class SharedHttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(body: unknown): void } }>();
    const request = host
      .switchToHttp()
      .getRequest<{ headers?: Record<string, unknown> }>();
    const requestId = request.headers?.["x-request-id"];
    if (exception instanceof AppError) {
      const result = errorResponse(
        exception,
        typeof requestId === "string" ? requestId : undefined,
      );
      return response.status(result.status).json(result.body);
    }
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const safe =
      status === 404
        ? new AppError("NOT_FOUND", "Resource not found")
        : status === 400
          ? new AppError("VALIDATION_FAILED", "Validation failed")
          : status === 401
            ? new AppError("UNAUTHENTICATED", "Authentication required")
            : status === 403
              ? new AppError("FORBIDDEN", "Access denied")
              : status === 409
                ? new AppError(
                    "CONFLICT",
                    "Request conflicts with current state",
                  )
                : status === 429
                  ? new AppError("RATE_LIMITED", "Too many requests")
                  : status === 503
                    ? new AppError(
                        "UPSTREAM_UNAVAILABLE",
                        "Service dependency unavailable",
                      )
                    : new Error("Internal server error");
    const result = errorResponse(
      safe,
      typeof requestId === "string" ? requestId : undefined,
    );
    return response.status(result.status).json(result.body);
  }
}
