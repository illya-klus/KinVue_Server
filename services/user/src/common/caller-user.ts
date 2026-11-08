import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import { AppError } from "@kinvue/errors";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CALLER_KEY = "callerUserId";

type CallerRequest = {
  headers?: Record<string, unknown>;
  [CALLER_KEY]?: string;
};

/**
 * The gateway verifies the JWT and forwards the subject as `x-user-id`
 * (it strips any client-supplied value first). This service is internal-only.
 */
@Injectable()
export class CallerUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CallerRequest>();
    const raw = request.headers?.["x-user-id"];
    const userId = typeof raw === "string" ? raw.trim() : "";
    if (!UUID.test(userId)) {
      throw new AppError("UNAUTHENTICATED", "Authentication required");
    }
    request[CALLER_KEY] = userId.toLowerCase();
    return true;
  }
}

export const CallerUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<CallerRequest>()[CALLER_KEY] as string,
);
