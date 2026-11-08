import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConsumerModule } from "./modules/consumer/consumer.module";
import { HealthModule } from "./modules/health/health.module";
import { MetricsModule } from "./modules/metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    MetricsModule,
    ConsumerModule,
  ],
})
export class AppModule {}
