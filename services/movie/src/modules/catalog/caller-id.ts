import { UnauthorizedException } from "@nestjs/common";
import { isUUID } from "class-validator";
export function callerId(value: string | undefined): string {
  if (!value || !isUUID(value))
    throw new UnauthorizedException("Trusted user context required");
  return value;
}
