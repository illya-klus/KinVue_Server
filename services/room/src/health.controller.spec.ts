import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import {
  HealthController,
  REDIS_READINESS,
  ROOMS_DATABASE_READINESS,
  type RedisReadiness,
} from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { SharedHttpErrorFilter } from "./errors.filters";
import request from "supertest";
import { initPrometheus } from "@kinvue/http-metrics";

describe("Rooms scaffold diagnostics", () => {
  let app: INestApplication;
  const redis: Pick<RedisReadiness, "ping"> = { ping: jest.fn() };
  const database = { ping: jest.fn() };
  beforeAll(async () => {
    initPrometheus("rooms");
    const module = await Test.createTestingModule({
      controllers: [HealthController, MetricsController],
      providers: [
        { provide: REDIS_READINESS, useValue: redis },
        { provide: ROOMS_DATABASE_READINESS, useValue: database },
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
      .expect({ status: "ok", service: "rooms" });
    const metrics = await request(app.getHttpServer())
      .get("/metrics")
      .expect(200);
    expect(metrics.headers["content-type"]).toContain("text/plain");
    expect(metrics.text).toContain("process_cpu_user_seconds_total");
  });
  it("reports only its own Redis readiness and a shared safe 404", async () => {
    (redis.ping as jest.Mock).mockResolvedValueOnce("PONG");
    database.ping.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    await request(app.getHttpServer()).get("/health/ready").expect(200);
    (redis.ping as jest.Mock).mockRejectedValueOnce(new Error("redis secret"));
    const ready = await request(app.getHttpServer())
      .get("/health/ready")
      .expect(503);
    expect(ready.body).toEqual({
      code: "UPSTREAM_UNAVAILABLE",
      message: "Service dependency unavailable",
    });
    const missing = await request(app.getHttpServer())
      .get("/missing")
      .set("x-request-id", "req-rooms")
      .expect(404);
    expect(missing.body).toEqual({
      code: "NOT_FOUND",
      message: "Resource not found",
      requestId: "req-rooms",
    });
  });
});
