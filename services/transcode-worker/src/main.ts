import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionsFilter } from "./common/filters";
import {
  httpMetricsMiddleware,
  initPrometheus,
} from "@kinvue/http-metrics";

async function bootstrap() {
  initPrometheus("transcode-worker");
  const app = await NestFactory.create(AppModule);
  app.use(httpMetricsMiddleware("transcode-worker"));
  const config = app.get(ConfigService);
  const logger = new Logger("main");

  app.useGlobalFilters(new GlobalExceptionsFilter());

  const port = config.get<number>("PORT", 4016);
  await app.listen(port);
  logger.log(`@kinvue/transcode-worker listening on ${port}`);
}
bootstrap();
