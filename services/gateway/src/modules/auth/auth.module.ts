import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "node:path";

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: "AUTH_PACKAGE",
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: "auth.v1",
            protoPath: join(
              process.cwd(),
              "../../packages/shared-protos/proto/auth.proto",
            ),
            url: configService.getOrThrow<string>("AUTH_GRPC_URL"),
          },
        }),
      },
    ]),
  ],
})
export class AuthModule {}
