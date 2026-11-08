import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  constructor() {}

  @Get("live")
  public health() {
    return {
      status: "ok",
      service: "KinVue gateway service",
    };
  }

  @Get("ready")
  public ready() {
    return {
      status: "ok",
      checks: {
        process: "ok",
      },
    };
  }
}
