import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
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
    app.setGlobalPrefix("/api");

    await app.init();
  });

  it("/health/live (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/health/live")
      .expect(200)
      .expect({
        status: "ok",
        service: "KinVue gateway service",
      });
  });

  it("/health/ready (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/health/ready")
      .expect(200)
      .expect({
        status: "ok",
        checks: {
          gatewayService: "true",
          authService: "false",
          chatService: "false",
          movieService: "false",
          notificationService: "false",
          roomService: "false",
          userService: "false",
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
