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
  initPrometheus("notification");
  const app = await NestFactory.create(AppModule);
  app.use(httpMetricsMiddleware("notification"));
  const config = app.get(ConfigService);
  const logger = new Logger("main");

  app.useGlobalFilters(new GlobalExceptionsFilter());

  await app.listen(config.get<number>("PORT", 4005));
  logger.log(
    `@kinvue/notification listening on ${config.get<number>("PORT", 4005)}`,
  );
}
bootstrap();
