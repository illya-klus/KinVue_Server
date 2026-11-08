import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Db, MongoClient } from "mongodb";

/** Shared lazily-connected client. Connection happens on first use, not boot. */
@Injectable()
export class MongoService implements OnApplicationShutdown {
  private readonly client: MongoClient;
  constructor(config: ConfigService) {
    this.client = new MongoClient(
      config.getOrThrow<string>("USERS_MONGO_URL"),
      {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        maxPoolSize: 10,
      },
    );
  }
  async db(): Promise<Db> {
    await this.client.connect();
    return this.client.db();
  }
  async onApplicationShutdown() {
    await this.client.close();
  }
}

export function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}
