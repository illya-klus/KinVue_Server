import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class CallerUserGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.header("x-user-id")?.trim();
    if (!userId) {
      throw new ForbiddenException("Missing caller identity");
    }
    (request as Request & { callerUserId: string }).callerUserId = userId;
    return true;
  }
}
