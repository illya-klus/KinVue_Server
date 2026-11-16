import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createServer } from "node:http";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { JwtVerificationService } from "../src/modules/proxy/jwt-verification.service";

describe("Health", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ AUTH_GRPC_URL: "127.0.0.1:59999" }))
      .compile();

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

  it("requires authentication at the Users routes and does not expose the profile bootstrap", async () => {
    await request(app.getHttpServer())
      .get("/api/users/me")
      .set("x-user-id", "550e8400-e29b-41d4-a716-446655440001")
      .expect(401);
    await request(app.getHttpServer())
      .post("/api/internal/users/profiles")
      .expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});

it("forwards a Users JSON mutation with the verified caller and request id", async () => {
  const caller = "550e8400-e29b-41d4-a716-446655440001";
  const upstream = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    res.setHeader("content-type", "application/json");
    const json = Buffer.concat(chunks).toString();
    res.end(
      JSON.stringify({
        path: req.url,
        caller: req.headers["x-user-id"],
        scopes: req.headers["x-user-scopes"],
        requestId: req.headers["x-request-id"],
        json: JSON.parse(json),
      }),
    );
  });
  await new Promise<void>((resolve) =>
    upstream.listen(0, "127.0.0.1", resolve),
  );
  let app: INestApplication<App> | undefined;
  try {
    const address = upstream.address();
    if (!address || typeof address === "string")
      throw new Error("No upstream port");
    const verified = { userId: caller, scopes: ["user"] };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          AUTH_GRPC_URL: "127.0.0.1:59999",
          USERS_SERVICE_URL: `http://127.0.0.1:${address.port}`,
        }),
      )
      .overrideProvider(JwtVerificationService)
      .useValue({
        verifyBearer: async () => verified,
        verifyRequired: async () => verified,
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    await request(app.getHttpServer())
      .patch("/api/users/me")
      .set("x-user-id", "spoofed")
      .set("x-user-scopes", "admin")
      .set("x-request-id", "test-request")
      .send({ displayName: "Test User" })
      .expect(200, {
        path: "/users/me",
        caller,
        scopes: "user",
        requestId: "test-request",
        json: { displayName: "Test User" },
      });
  } finally {
    await app?.close();
    await new Promise<void>((resolve, reject) =>
      upstream.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
