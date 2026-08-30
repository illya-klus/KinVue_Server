import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class GrcpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrcpLoggingInterceptor.name);

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
          this.logger.log(
            `gRPC success ${controller}.${handler} ${Date.now() - startedAt}ms`,
          );
        },
        error: (error) => {
          this.logger.error(
            `gRPC error ${controller}.${handler} ${Date.now() - startedAt}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}
