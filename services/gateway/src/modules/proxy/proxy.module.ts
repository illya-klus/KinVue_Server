import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from "@nestjs/common";
import { RequestIdMiddleware } from "../../common/middleware/request-ids.middleware";
import { RequestsLoggerMiddleware } from "../../common/middleware/requests-loger.middleware";
import { GatewayProxyMiddleware } from "./gateway-proxy.middleware";
import { JwksService } from "./jwks.service";
import { JwtVerificationService } from "./jwt-verification.service";
import { RateLimitService } from "./rate-limit.service";
import { UpstreamService } from "./upstream.service";
import { WellKnownController } from "./well-known.controller";

@Module({
  controllers: [WellKnownController],
  providers: [
    JwksService,
    JwtVerificationService,
    RateLimitService,
    UpstreamService,
    GatewayProxyMiddleware,
  ],
})
export class ProxyModule implements NestModule {
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
