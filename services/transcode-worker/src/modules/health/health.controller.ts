import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { ReadinessService } from "./readiness.service";

@Controller("health")
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get("live")
  public health() {
    return {
      status: "ok",
      service: "KinVue transcode worker",
    };
  }

  @Get("ready")
  public async ready(@Res() res: Response) {
    const checks = await this.readiness.check();
    const ok = Object.values(checks).every((value) => value === "ok");
    const body = { status: ok ? "ok" : "degraded", checks };
    return res.status(ok ? 200 : 503).json(body);
  }
}
