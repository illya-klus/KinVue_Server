import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongoClient } from "mongodb";
import type { ReadinessCheck } from "./health.controller";

@Injectable()
export class UsersMongoReadiness
  implements ReadinessCheck, OnApplicationShutdown
{
  private readonly client: MongoClient;
  constructor(config: ConfigService) {
    this.client = new MongoClient(
      config.getOrThrow<string>("USERS_MONGO_URL"),
      {
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 1500,
        socketTimeoutMS: 1500,
        waitQueueTimeoutMS: 1500,
        maxPoolSize: 2,
      },
    );
  }
  async check(): Promise<void> {
    // A failed implicit connection leaves a closed topology. Explicit connect
    // retries it on the next probe and reuses the topology when already healthy.
    await this.client.connect();
    await this.client.db().command({ ping: 1 }, { timeoutMS: 1500 });
  }
  async onApplicationShutdown() {
    await this.client.close();
  }
}
