import express from "express";
import type { INestApplication } from "@nestjs/common";
import type { ErrorRequestHandler } from "express";

export const GATEWAY_JSON_BODY_LIMIT = "1mb";

export function installJsonBodyParser(app: INestApplication): void {
  app.use(express.json({ limit: GATEWAY_JSON_BODY_LIMIT }));
  const handleBodyParserError: ErrorRequestHandler = (
    error,
    _req,
    res,
    next,
  ) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large"
    ) {
      res.status(400).json({
        statusCode: 400,
        message: "JSON request body exceeds the 1 MiB limit.",
      });
      return;
    }
    next(error);
  };
  app.use(handleBodyParserError);
}
