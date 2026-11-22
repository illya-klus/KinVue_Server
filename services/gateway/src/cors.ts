import type { INestApplication } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export function configureGatewayCors(
  app: INestApplication,
  originSetting: string,
): void {
  const origins = originSetting
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error("At least one Gateway ORIGINS value is required");
  }

  const allowedOrigins = new Set(origins);
  app.use((request: Request, response: Response, next: NextFunction) => {
    const origin = request.get("Origin");
    if (!origin || allowedOrigins.has(origin)) {
      next();
      return;
    }
    response.status(403).json({
      statusCode: 403,
      message: "Origin not allowed",
    });
  });

  app.enableCors({
    origin: origins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization",
  });
}
