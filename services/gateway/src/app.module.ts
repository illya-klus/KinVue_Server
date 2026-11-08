import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./modules/health/health.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { RequestIdMiddleware } from "./common/middleware/request-ids.middleware";
import { RequestsLoggerMiddleware } from "./common/middleware/requests-loger.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { ProxyModule } from "./modules/proxy/proxy.module";
import { GatewayProxyMiddleware } from "./modules/proxy/gateway-proxy.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    MetricsModule,
    ProxyModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,
        RequestsLoggerMiddleware,
        GatewayProxyMiddleware,
      )
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
