import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";

export const READINESS_CHECK = Symbol("READINESS_CHECK");
export interface ReadinessCheck {
  check(): Promise<void>;
}

@Controller("health")
export class HealthController {
  constructor(
    @Inject(READINESS_CHECK) private readonly readiness: ReadinessCheck,
  ) {}

  @Get("live")
  live() {
    return { status: "ok", service: "users" };
  }

  @Get("ready")
  async ready() {
    try {
      await this.readiness.check();
      return { status: "ok", service: "users" };
    } catch {
      throw new ServiceUnavailableException("Service dependency unavailable");
    }
  }
}
