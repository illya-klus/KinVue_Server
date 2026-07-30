import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "node:path";

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

  await app.listen();
}
bootstrap();
