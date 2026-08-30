import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  GrpcExceptionFilter,
  MicroserviceOptions,
  Transport,
} from "@nestjs/microservices";
import { join } from "node:path";
import { GrcpLoggingInterceptor } from "./common/interseptors/logger.interseptor";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "auth.v1",
        protoPath: join(
          process.cwd(),
          "../../packages/shared-protos/proto/auth.proto",
        ),
        url: "0.0.0.0:50051",
      },
    },
  );
  app.useGlobalInterceptors(new GrcpLoggingInterceptor());
  app.useGlobalFilters(new GrpcExceptionFilter());

  await app.listen();
}
bootstrap();
