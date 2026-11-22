import type { INestApplication } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { configureGatewayCors } from "./cors";

describe("Gateway CORS policy", () => {
  function setup(
    originSetting = "http://localhost:3000, https://kinvue.example",
  ) {
    const app = {
      use: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;
    configureGatewayCors(app, originSetting);
    const guard = (app.use as jest.Mock).mock.calls[0]?.[0] as (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => void;
    return { app, guard };
  }

  it("allows configured local development and production origins", () => {
    const { app, guard } = setup();
    const next = jest.fn();

    guard(
      { get: () => "http://localhost:3000" } as unknown as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ["http://localhost:3000", "https://kinvue.example"],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
      allowedHeaders: "Content-Type, Authorization",
    });
  });

  it("rejects an origin that is not in the configured allowlist", () => {
    const { guard } = setup();
    const next = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    guard(
      { get: () => "https://attacker.example" } as unknown as Request,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 403,
      message: "Origin not allowed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an empty origin allowlist", () => {
    const app = {
      use: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;

    expect(() => configureGatewayCors(app, " , ")).toThrow(
      "At least one Gateway ORIGINS value is required",
    );
  });
});
