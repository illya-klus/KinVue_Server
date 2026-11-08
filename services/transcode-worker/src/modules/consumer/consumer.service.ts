import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);

  public onModuleInit() {
    this.logger.log("Transcode worker waiting for media.transcode jobs.");
  }
}
