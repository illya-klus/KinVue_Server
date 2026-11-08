import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MeilisearchClient } from "./meilisearch.client";
import {
  MEILI_FILTERABLE,
  MEILI_SEARCHABLE,
  MEILI_SORTABLE,
  MOVIES_INDEX,
} from "./meilisearch.constants";

@Injectable()
export class MeilisearchIndexSetupService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchIndexSetupService.name);

  constructor(private readonly meili: MeilisearchClient) {}

  public async onModuleInit(): Promise<void> {
    await this.ensureIndexSettings();
  }

  public async ensureIndexSettings(): Promise<void> {
    await this.meili.ensureIndex(MOVIES_INDEX, "id");
    const index = this.meili.index(MOVIES_INDEX);

    await index.updateSearchableAttributes([...MEILI_SEARCHABLE]);
    await index.updateFilterableAttributes([...MEILI_FILTERABLE]);
    await index.updateSortableAttributes([...MEILI_SORTABLE]);
    this.logger.log(`Meilisearch index "${MOVIES_INDEX}" settings applied`);
  }
}
