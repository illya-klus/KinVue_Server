import { Injectable, Logger } from "@nestjs/common";
import type { NotificationEvent } from "@kinvue/contracts";

@Injectable()
export class FakePushProvider {
  private readonly logger = new Logger(FakePushProvider.name);

  public deliverInApp(event: NotificationEvent): void {
    this.logger.log(
      `fake-push provider: in-app only for ${event.type} -> ${event.recipientId}`,
    );
  }
}
