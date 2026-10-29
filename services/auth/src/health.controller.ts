import {
  Controller,
  Get,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

export const AUTH_READINESS_CHECK = Symbol("AUTH_READINESS_CHECK");
export interface AuthReadinessCheck {
  checkReadiness(): Promise<void>;
}

@Injectable()
export class AuthReadiness {
  constructor(
    @Inject(AUTH_READINESS_CHECK)
    private readonly readiness: AuthReadinessCheck,
  ) {}
  async check() {
    await this.readiness.checkReadiness();
  }
}

@Controller("health")
export class HealthController {
  constructor(private readonly readiness: AuthReadiness) {}
  @Get("live")
  live() {
    return { status: "ok", service: "auth" };
  }
  @Get("ready")
  async ready() {
    try {
      await this.readiness.check();
      return { status: "ok", service: "auth" };
    } catch {
      throw new ServiceUnavailableException("Service dependency unavailable");
    }
  }
}
