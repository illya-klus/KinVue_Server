import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
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
    await app.init();
  });

  it("/health/live (GET)", () => {
    return request(app.getHttpServer())
      .get("/health/live")
      .expect(200)
      .expect({
        status: "ok",
        service: "KinVue notifications service",
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
