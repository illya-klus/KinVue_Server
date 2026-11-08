import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MessagingModule } from "./messaging/messaging.module";
import { ConsumerModule } from "./modules/consumer/consumer.module";
import { HealthModule } from "./modules/health/health.module";
import { MetricsModule } from "./modules/metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MessagingModule,
    HealthModule,
    MetricsModule,
    ConsumerModule,
  ],
})
export class AppModule {}
