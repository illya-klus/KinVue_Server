import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);

  public onModuleInit() {
    this.logger.log("Notification consumer waiting for jobs (not wired yet).");
  }
}
