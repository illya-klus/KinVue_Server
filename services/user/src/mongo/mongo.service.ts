import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type ClientSession, type Db, MongoClient } from "mongodb";

/** Shared lazily-connected client. Connection happens on first use, not boot. */
@Injectable()
export class MongoService implements OnApplicationShutdown {
  private readonly client: MongoClient;
  private schema?: Promise<void>;
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
    const db = this.client.db();
    this.schema ??= this.initialize(db).catch((error: unknown) => {
      this.schema = undefined;
      throw error;
    });
    await this.schema;
    return db;
  }

  async check(): Promise<void> {
    const hello = await (
      await this.db()
    ).command({ hello: 1 }, { timeoutMS: 1500 });
    if (
      !hello.isWritablePrimary ||
      (!hello.setName && hello.msg !== "isdbgrid")
    ) {
      throw new Error("Users MongoDB must support transactions");
    }
  }

  transaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    return this.client.withSession((session) =>
      session.withTransaction(() => work(session), {
        writeConcern: { w: "majority" },
      }),
    );
  }

  private async initialize(db: Db): Promise<void> {
    await Promise.all([
      db
        .collection("users")
        .createIndexes([
          { key: { username: 1 }, unique: true },
          { key: { displayName: 1 } },
          { key: { createdAt: 1, _id: 1 } },
        ]),
      db
        .collection("friendships")
        .createIndexes([
          { key: { user1Id: 1, user2Id: 1 }, unique: true },
          { key: { user1Id: 1, status: 1, createdAt: 1, _id: 1 } },
          { key: { user2Id: 1, status: 1, createdAt: 1, _id: 1 } },
          { key: { requestedBy: 1, status: 1, createdAt: 1, _id: 1 } },
          { key: { addresseeId: 1, status: 1, createdAt: 1, _id: 1 } },
          { key: { status: 1, createdAt: 1, _id: 1 } },
        ]),
      db
        .collection("outbox_events")
        .createIndexes([
          { key: { eventId: 1 }, unique: true },
          { key: { status: 1, createdAt: 1, _id: 1 } },
        ]),
    ]);
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
