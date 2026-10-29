import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnvironmentConfig, roomsConfigSchema } from "@kinvue/config";
import { SharedHttpErrorFilter } from "./errors.filters";
import { SharedLogger } from "./shared-logger";

async function bootstrap() {
  const config = loadEnvironmentConfig(roomsConfigSchema);
  const app = await NestFactory.create(AppModule);
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
