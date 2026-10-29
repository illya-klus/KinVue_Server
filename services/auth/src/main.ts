import { NestFactory } from "@nestjs/core";
import { authConfigSchema, loadEnvironmentConfig } from "@kinvue/config";
import { AppModule } from "./app.module.js";
import {
  GrpcExceptionFilter,
  MicroserviceOptions,
  Transport,
} from "@nestjs/microservices";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { GrcpLoggingInterceptor } from "./common/interseptors/logger.interseptor.js";
import { SharedHttpErrorFilter } from "./shared-http-error.filter.js";
import { SharedLogger } from "./shared-logger.js";

async function bootstrap() {
  const config = loadEnvironmentConfig(authConfigSchema);
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(app.get(SharedHttpErrorFilter));
  app.useLogger(app.get(SharedLogger));
  app.enableShutdownHooks();
  const grpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "auth.v1",
      protoPath:
        [
          join(process.cwd(), "packages/shared-protos/proto/auth.proto"),
          join(
            process.cwd(),
            "node_modules/@kinvue/contracts/proto/auth.proto",
          ),
        ].find(existsSync) ?? "packages/shared-protos/proto/auth.proto",
      url: config.AUTH_GRPC_URL,
    },
  });
  grpc.useGlobalInterceptors(new GrcpLoggingInterceptor());
  grpc.useGlobalFilters(new GrpcExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(config.AUTH_HTTP_PORT, config.AUTH_HTTP_HOST);
  app.get(SharedLogger).log("service listening", {
    service: "auth",
    httpPort: config.AUTH_HTTP_PORT,
    grpcTarget: config.AUTH_GRPC_URL,
  });
}
bootstrap().catch((error: unknown) => {
  process.stderr.write(
    `Auth failed to start: ${error instanceof Error ? error.name : "UnknownError"}\n`,
  );
  process.exitCode = 1;
});
