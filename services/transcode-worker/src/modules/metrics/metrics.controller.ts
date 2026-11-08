import { Controller, Get, Header } from "@nestjs/common";
import { prometheusContentType, renderPrometheus } from "@kinvue/http-metrics";

@Controller("metrics")
export class MetricsController {
  @Get()
  @Header("Content-Type", prometheusContentType)
  public async metrics(): Promise<string> {
    return renderPrometheus();
  }
}
