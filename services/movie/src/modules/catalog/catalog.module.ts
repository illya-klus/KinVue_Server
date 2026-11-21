import { Module } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Injectable, Logger } from "@nestjs/common";
import { SearchModule } from "../search/search.module";
import { CatalogService } from "./catalog.service";
import {
  AdminCatalogController,
  PublicCatalogController,
} from "./catalog.controller";

@Injectable()
export class PublicationScheduler {
  private readonly logger = new Logger(PublicationScheduler.name);
  constructor(private readonly catalog: CatalogService) {}
  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async publishDue() {
    try {
      await this.catalog.publishDue();
    } catch {
      this.logger.warn("Could not read due publications; retrying next minute");
    }
  }
}
@Module({
  imports: [SearchModule],
  controllers: [AdminCatalogController, PublicCatalogController],
  providers: [CatalogService, PublicationScheduler],
})
export class CatalogModule {}
