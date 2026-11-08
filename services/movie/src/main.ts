import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { loadEnvironmentConfig, movieConfigSchema } from "@kinvue/config";
import { AppModule } from "./app.module";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";
import {
  httpMetricsMiddleware,
  initPrometheus,
} from "@kinvue/http-metrics";

async function bootstrap() {
  initPrometheus("movie");
  const config = loadEnvironmentConfig(movieConfigSchema);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(httpMetricsMiddleware("movie"));
  app.useLogger(app.get(SharedLogger));
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  app.useGlobalFilters(app.get(SharedHttpErrorFilter));
  app.enableShutdownHooks();
  await app.listen(config.MOVIE_HTTP_PORT, config.MOVIE_HTTP_HOST);
  app.get(SharedLogger).log("service listening", {
    service: "movie",
    httpPort: config.MOVIE_HTTP_PORT,
  });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `movie failed to start: ${error instanceof Error ? error.name : "UnknownError"}\n`,
  );
  process.exitCode = 1;
});
