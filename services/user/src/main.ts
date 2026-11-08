import { NestFactory } from "@nestjs/core";
import { usersConfigSchema, loadEnvironmentConfig } from "@kinvue/config";
import { AppModule } from "./app.module";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";
import { httpMetricsMiddleware, initPrometheus } from "@kinvue/http-metrics";

async function bootstrap() {
  initPrometheus("users");
  const config = loadEnvironmentConfig(usersConfigSchema);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(httpMetricsMiddleware("users"));
  app.useLogger(app.get(SharedLogger));
  app.useGlobalFilters(app.get(SharedHttpErrorFilter));
  app.enableShutdownHooks();
  await app.listen(config.USERS_HTTP_PORT, config.USERS_HTTP_HOST);
  app.get(SharedLogger).log("service listening", {
    service: "users",
    httpPort: config.USERS_HTTP_PORT,
  });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `users failed to start: ${error instanceof Error ? error.name : "UnknownError"}\n`,
  );
  process.exitCode = 1;
});
