import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, RequestMethod } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";

describe("Health", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api", {
      exclude: [
        { path: "health", method: RequestMethod.ALL },
        { path: "health/(.*)", method: RequestMethod.ALL },
        { path: "metrics", method: RequestMethod.GET },
      ],
    });

    await app.init();
  });

  it("/health/live (GET)", () => {
    return request(app.getHttpServer()).get("/health/live").expect(200).expect({
      status: "ok",
      service: "KinVue gateway service",
    });
  });

  it("/health/ready (GET)", () => {
    return request(app.getHttpServer())
      .get("/health/ready")
      .expect(200)
      .expect({
        status: "ok",
        checks: {
          process: "ok",
        },
      });
  });

  it("/metrics (GET)", () => {
    return request(app.getHttpServer())
      .get("/metrics")
      .expect(200)
      .expect("Content-Type", /text\/plain/);
  });

  afterEach(async () => {
    await app.close();
  });
});
