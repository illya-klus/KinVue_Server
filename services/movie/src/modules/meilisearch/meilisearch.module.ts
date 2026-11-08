import { Module } from "@nestjs/common";
import { MeilisearchClient } from "./meilisearch.client";
import { MeilisearchIndexSetupService } from "./meilisearch-index-setup.service";

@Module({
  providers: [MeilisearchClient, MeilisearchIndexSetupService],
  exports: [MeilisearchClient, MeilisearchIndexSetupService],
})
export class MeilisearchModule {}
