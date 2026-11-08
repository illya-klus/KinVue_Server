import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionsFilter } from "./common/filters";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger("main");

  app.useGlobalFilters(new GlobalExceptionsFilter());

  const port = config.get<number>("PORT", 4016);
  await app.listen(port);
  logger.log(`@kinvue/transcode-worker listening on ${port}`);
}
bootstrap();
