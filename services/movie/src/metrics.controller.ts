import { Controller, Get, Header, Injectable } from "@nestjs/common";

@Injectable()
export class MetricsService {
  readonly startedAt = Date.now();
  render() {
    return `# HELP service_up Whether the service process is running.\n# TYPE service_up gauge\nservice_up 1\n# HELP process_uptime_seconds Process uptime in seconds.\n# TYPE process_uptime_seconds gauge\nprocess_uptime_seconds ${((Date.now() - this.startedAt) / 1000).toFixed(0)}\n`;
  }
}

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}
  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  getMetrics() {
    return this.metrics.render();
  }
}
