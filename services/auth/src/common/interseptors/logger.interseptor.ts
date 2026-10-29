import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { createLogger } from "@kinvue/logger";

@Injectable()
export class GrcpLoggingInterceptor implements NestInterceptor {
  private readonly logger = createLogger("auth");

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info("gRPC request completed", {
            controller,
            handler,
            durationMs: Date.now() - startedAt,
          });
        },
        error: (error) => {
          this.logger.error("gRPC request failed", {
            controller,
            handler,
            durationMs: Date.now() - startedAt,
            error,
          });
        },
      }),
    );
  }
}
