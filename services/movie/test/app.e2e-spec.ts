import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { MoviePostgresReadiness } from "../src/readiness";
import { SharedHttpErrorFilter } from "../src/errors.filters";

describe("movie application (e2e)", () => {
  let app: INestApplication;
  const readiness = { check: jest.fn() };
  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      MOVIE_DATABASE_URL: "postgresql://test:test@127.0.0.1:1/kinvue_movies",
      MEILISEARCH_HOST: "http://127.0.0.1:1",
      MEILISEARCH_MASTER_KEY: "test-key",
    });
    const { AppModule } = require("../src/app.module");
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MoviePostgresReadiness)
      .useValue(readiness)
      .compile();
    app = module.createNestApplication();
    app.useGlobalFilters(app.get(SharedHttpErrorFilter));
    await app.init();
  });
  afterAll(async () => app.close());

  it("wires the complete module to diagnostics and the configured readiness provider", async () => {
    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200)
      .expect({ status: "ok", service: "movie" });
    readiness.check.mockResolvedValueOnce(undefined);
    await request(app.getHttpServer()).get("/health/ready").expect(200);
    readiness.check.mockRejectedValueOnce(
      new Error("do not expose connection details"),
    );
    const failure = await request(app.getHttpServer())
      .get("/health/ready")
      .expect(503);
    expect(failure.body).toEqual({
      code: "UPSTREAM_UNAVAILABLE",
      message: "Service dependency unavailable",
    });
    await request(app.getHttpServer()).get("/metrics").expect(200);
    const missing = await request(app.getHttpServer())
      .get("/missing")
      .expect(404);
    expect(missing.body.code).toBe("NOT_FOUND");
  });
});
