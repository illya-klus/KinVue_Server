import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnvironmentConfig, roomsConfigSchema } from "@kinvue/config";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";
import { httpMetricsMiddleware, initPrometheus } from "@kinvue/http-metrics";

async function bootstrap() {
  initPrometheus("rooms");
  const config = loadEnvironmentConfig(roomsConfigSchema);
  const app = await NestFactory.create(AppModule);
  app.use(httpMetricsMiddleware("rooms"));
  app.useGlobalFilters(app.get(SharedHttpErrorFilter));
  app.useLogger(app.get(SharedLogger));
  app.enableShutdownHooks();
  await app.listen(config.ROOMS_HTTP_PORT, config.ROOMS_HTTP_HOST);
  app.get(SharedLogger).log("service listening", {
    service: "rooms",
    port: config.ROOMS_HTTP_PORT,
  });
}
bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `Rooms failed to start: ${error instanceof Error ? error.name : "UnknownError"}\n`,
  );
  process.exitCode = 1;
});
