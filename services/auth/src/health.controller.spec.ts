import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { HealthController, AuthReadiness } from "./health.controller.js";
import { MetricsController } from "./metrics.controller.js";
import { SharedHttpErrorFilter } from "./shared-http-error.filter.js";
import request from "supertest";
import { initPrometheus } from "@kinvue/http-metrics";

describe("Auth scaffold diagnostics", () => {
  let app: INestApplication;
  let check: () => Promise<void> = async () => {};
  beforeAll(async () => {
    initPrometheus("auth");
    const module = await Test.createTestingModule({
      controllers: [HealthController, MetricsController],
      providers: [
        { provide: AuthReadiness, useValue: { check: () => check() } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new SharedHttpErrorFilter());
    await app.init();
  });
  afterAll(async () => app.close());
  it("serves liveness and Prometheus text", async () => {
    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200)
      .expect({ status: "ok", service: "auth" });
    const metrics = await request(app.getHttpServer())
      .get("/metrics")
      .expect(200);
    expect(metrics.headers["content-type"]).toContain("text/plain");
    expect(metrics.text).toContain("process_cpu_user_seconds_total");
  });
  it("reports its own database readiness and a shared safe 404", async () => {
    check = async () => {};
    await request(app.getHttpServer()).get("/health/ready").expect(200);
    check = async () => {
      throw new Error("postgres://user:secret@db/prod");
    };
    const ready = await request(app.getHttpServer())
      .get("/health/ready")
      .expect(503);
    expect(ready.body.message).not.toContain("secret");
    const missing = await request(app.getHttpServer())
      .get("/missing")
      .set("x-request-id", "req-123")
      .expect(404);
    expect(missing.body).toEqual({
      code: "NOT_FOUND",
      message: "Resource not found",
      requestId: "req-123",
    });
  });
});
