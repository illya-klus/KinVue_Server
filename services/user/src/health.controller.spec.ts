import { Test } from "@nestjs/testing";
import {
  Controller,
  Get,
  type INestApplication,
  NotFoundException,
} from "@nestjs/common";
import { HealthController, READINESS_CHECK } from "./health.controller";
import { MetricsController, MetricsService } from "./metrics.controller";
import { SharedHttpErrorFilter } from "./errors.filters";
import request from "supertest";

@Controller("test")
class FailureController {
  @Get("missing")
  missing() {
    throw new NotFoundException("private database details");
  }
  @Get("error")
  error() {
    throw new Error("private database details");
  }
}

describe("users diagnostics", () => {
  let app: INestApplication;
  const readiness = { check: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController, MetricsController, FailureController],
      providers: [
        MetricsService,
        { provide: READINESS_CHECK, useValue: readiness },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new SharedHttpErrorFilter());
    await app.init();
  });
  afterAll(async () => app.close());

  it("keeps live independent of database availability and serves Prometheus text", async () => {
    readiness.check.mockRejectedValue(new Error("private database details"));
    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200)
      .expect({ status: "ok", service: "users" });
    const metrics = await request(app.getHttpServer())
      .get("/metrics")
      .expect(200);
    expect(metrics.headers["content-type"]).toContain("text/plain");
    expect(metrics.text).toContain("# TYPE service_up gauge");
    expect(metrics.text).toContain("service_up 1");
  });

  it("returns 503 on dependency failure and recovers to 200", async () => {
    readiness.check.mockRejectedValueOnce(
      new Error("private database details"),
    );
    const down = await request(app.getHttpServer())
      .get("/health/ready")
      .expect(503);
    expect(down.body).toEqual({
      code: "UPSTREAM_UNAVAILABLE",
      message: "Service dependency unavailable",
    });
    readiness.check.mockResolvedValueOnce(undefined);
    await request(app.getHttpServer())
      .get("/health/ready")
      .expect(200)
      .expect({ status: "ok", service: "users" });
  });

  it("normalizes thrown and unmatched 404s and hides unexpected failures", async () => {
    for (const path of ["/test/missing", "/missing", "/"]) {
      const missing = await request(app.getHttpServer())
        .get(path)
        .set("x-request-id", "req-users")
        .expect(404);
      expect(missing.body).toEqual({
        code: "NOT_FOUND",
        message: "Resource not found",
        requestId: "req-users",
      });
    }
    const failure = await request(app.getHttpServer())
      .get("/test/error")
      .expect(500);
    expect(JSON.stringify(failure.body)).not.toContain(
      "private database details",
    );
    expect(failure.body.code).toBe("INTERNAL");
  });
});
