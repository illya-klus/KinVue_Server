import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { RequestIdMiddleware } from "./common/middleware/request-ids.middleware";
import { RequestsLoggerMiddleware } from "./common/middleware/requests-loger.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "node:path";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
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

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestsLoggerMiddleware)
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
