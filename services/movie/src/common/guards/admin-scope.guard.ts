import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class AdminScopeGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const scopesHeader = request.header("x-user-scopes") ?? "";
    const scopes = scopesHeader
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
    if (!scopes.includes("admin")) {
      throw new ForbiddenException("Admin scope required");
    }
    return true;
  }
}
