import { Injectable } from "@nestjs/common";
import type { NotificationEvent } from "@kinvue/contracts";
import type { ClientSession } from "mongodb";
import { MongoService } from "../mongo/mongo.service";

export type FriendshipEvent = Extract<NotificationEvent, { producer: "users" }>;
type OutboxDoc = FriendshipEvent & {
  status: "PENDING" | "PUBLISHED";
  createdAt: Date;
  publishedAt?: Date;
};

@Injectable()
export class OutboxRepository {
  constructor(private readonly mongo: MongoService) {}

  private async collection() {
    return (await this.mongo.db()).collection<OutboxDoc>("outbox_events");
  }

  async enqueue(event: FriendshipEvent, session: ClientSession) {
    await (
      await this.collection()
    ).insertOne(
      {
        ...event,
        status: "PENDING",
        createdAt: new Date(event.occurredAt),
      },
      { session },
    );
  }

  async pending(): Promise<FriendshipEvent[]> {
    const docs = await (
      await this.collection()
    )
      .find({ status: "PENDING" })
      .sort({ createdAt: 1, _id: 1 })
      .limit(25)
      .toArray();
    return docs.map(
      ({ eventId, type, producer, occurredAt, recipientId, payload }) => ({
        eventId,
        type,
        producer,
        occurredAt,
        recipientId,
        payload,
      }),
    );
  }

  async markPublished(eventId: string) {
    await (
      await this.collection()
    ).updateOne(
      { eventId, status: "PENDING" },
      {
        $set: { status: "PUBLISHED", publishedAt: new Date() },
      },
    );
  }
}
