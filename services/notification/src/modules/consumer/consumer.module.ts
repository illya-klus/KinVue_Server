import { Module } from "@nestjs/common";
import { ConsumerService } from "./consumer.service";
import { FakePushProvider } from "./fake-push.provider";

@Module({
  providers: [ConsumerService, FakePushProvider],
})
export class ConsumerModule {}
