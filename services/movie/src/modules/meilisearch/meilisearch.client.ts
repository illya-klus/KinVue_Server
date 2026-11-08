import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MeiliSearch } from "meilisearch";

@Injectable()
export class MeilisearchClient {
  private readonly client: MeiliSearch;

  constructor(config: ConfigService) {
    this.client = new MeiliSearch({
      host: config.getOrThrow<string>("MEILISEARCH_HOST"),
      apiKey: config.getOrThrow<string>("MEILISEARCH_MASTER_KEY"),
    });
  }

  public index(name: string) {
    return this.client.index(name);
  }

  public async ensureIndex(uid: string, primaryKey = "id"): Promise<void> {
    try {
      await this.client.getIndex(uid);
    } catch {
      await this.client.createIndex(uid, { primaryKey });
    }
  }
}
