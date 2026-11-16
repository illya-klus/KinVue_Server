import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Filter } from "mongodb";
import {
  type FriendshipDoc,
  type FriendshipStatus,
  normalizeFriendshipPair,
} from "./friendships.types";
import { MongoService, isDuplicateKey } from "../mongo/mongo.service";
import { type PageOptions, cursorFilter } from "../mongo/pagination";
import { OutboxRepository } from "../events/outbox.repository";

export class FriendshipConflictError extends Error {}

@Injectable()
export class FriendshipsRepository {
  constructor(
    private readonly mongo: MongoService,
    private readonly outbox: OutboxRepository,
  ) {}

  private async collection() {
    return (await this.mongo.db()).collection<FriendshipDoc>("friendships");
  }

  async findById(id: string): Promise<FriendshipDoc | null> {
    return (await this.collection()).findOne({ _id: id });
  }

  async createPending(
    requestedBy: string,
    addresseeId: string,
  ): Promise<FriendshipDoc> {
    const col = await this.collection();
    const now = new Date();
    const doc: FriendshipDoc = {
      _id: randomUUID(),
      ...normalizeFriendshipPair(requestedBy, addresseeId),
      requestedBy,
      addresseeId,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    const eventId = randomUUID();
    try {
      return await this.mongo.transaction(async (session) => {
        await col.insertOne(doc, { session });
        await this.outbox.enqueue(
          {
            eventId,
            type: "FRIEND_REQUEST_CREATED",
            producer: "users",
            occurredAt: now.toISOString(),
            recipientId: addresseeId,
            payload: { friendshipId: doc._id, fromUserId: requestedBy },
          },
          session,
        );
        return doc;
      });
    } catch (error) {
      if (isDuplicateKey(error)) throw new FriendshipConflictError();
      throw error;
    }
  }

  /** Update only a pending request addressed to the caller. Accept and its event commit together. */
  async resolvePending(
    id: string,
    addresseeId: string,
    status: Exclude<FriendshipStatus, "PENDING">,
  ): Promise<FriendshipDoc | null> {
    const col = await this.collection();
    const now = new Date();
    const filter = { _id: id, addresseeId, status: "PENDING" } as const;
    const update = { $set: { status, updatedAt: now } };
    if (status === "REJECTED") {
      return col.findOneAndUpdate(filter, update, { returnDocument: "after" });
    }
    const eventId = randomUUID();
    return this.mongo.transaction(async (session) => {
      const doc = await col.findOneAndUpdate(filter, update, {
        returnDocument: "after",
        session,
      });
      if (doc) {
        await this.outbox.enqueue(
          {
            eventId,
            type: "FRIEND_REQUEST_ACCEPTED",
            producer: "users",
            occurredAt: now.toISOString(),
            recipientId: doc.requestedBy,
            payload: { friendshipId: id, fromUserId: addresseeId },
          },
          session,
        );
      }
      return doc;
    });
  }

  listIncoming(userId: string, page: PageOptions) {
    return this.list({ addresseeId: userId, status: "PENDING" }, page);
  }

  listOutgoing(userId: string, page: PageOptions) {
    return this.list({ requestedBy: userId, status: "PENDING" }, page);
  }

  listAccepted(userId: string, page: PageOptions) {
    return this.list(
      { status: "ACCEPTED", $or: [{ user1Id: userId }, { user2Id: userId }] },
      page,
    );
  }

  private async list(
    filter: Filter<FriendshipDoc>,
    { limit, after }: PageOptions,
  ) {
    return (await this.collection())
      .find({ $and: [filter, cursorFilter(after)] })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .toArray();
  }
}
