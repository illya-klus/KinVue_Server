import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import {
  type FriendshipDoc,
  type FriendshipStatus,
  pairKey,
} from "./friendships.types";
import { MongoService, isDuplicateKey } from "../mongo/mongo.service";

export class FriendshipConflictError extends Error {}

@Injectable()
export class FriendshipsRepository {
  private collectionPromise?: Promise<Collection<FriendshipDoc>>;

  constructor(private readonly mongo: MongoService) {}

  /** Indexes are created on first use so boot does not require MongoDB. */
  private collection(): Promise<Collection<FriendshipDoc>> {
    this.collectionPromise ??= (async () => {
      const col = (await this.mongo.db()).collection<FriendshipDoc>(
        "friendships",
      );
      await col.createIndex({ pairKey: 1 }, { unique: true });
      await col.createIndex({ requesterId: 1, status: 1 });
      await col.createIndex({ addresseeId: 1, status: 1 });
      return col;
    })().catch((error: unknown) => {
      this.collectionPromise = undefined;
      throw error;
    });
    return this.collectionPromise;
  }

  async findById(id: string): Promise<FriendshipDoc | null> {
    return (await this.collection()).findOne({ _id: id });
  }

  /**
   * Creates a PENDING request, or re-opens a REJECTED one for the pair.
   * Throws FriendshipConflictError if the pair is already PENDING/ACCEPTED.
   */
  async createPending(
    requesterId: string,
    addresseeId: string,
  ): Promise<FriendshipDoc> {
    const col = await this.collection();
    const key = pairKey(requesterId, addresseeId);
    const now = new Date();
    const existing = await col.findOne({ pairKey: key });
    if (!existing) {
      const doc: FriendshipDoc = {
        _id: randomUUID(),
        pairKey: key,
        requesterId,
        addresseeId,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      };
      try {
        await col.insertOne(doc);
        return doc;
      } catch (error) {
        if (isDuplicateKey(error)) throw new FriendshipConflictError();
        throw error;
      }
    }
    if (existing.status !== "REJECTED") throw new FriendshipConflictError();
    const reopened = await col.findOneAndUpdate(
      { _id: existing._id, status: "REJECTED" },
      {
        $set: {
          requesterId,
          addresseeId,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    if (!reopened) throw new FriendshipConflictError();
    return reopened;
  }

  /** Atomic PENDING -> status transition, only for the addressee. */
  async resolvePending(
    id: string,
    addresseeId: string,
    status: Exclude<FriendshipStatus, "PENDING">,
  ): Promise<FriendshipDoc | null> {
    return (await this.collection()).findOneAndUpdate(
      { _id: id, addresseeId, status: "PENDING" },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }

  async listIncoming(userId: string): Promise<FriendshipDoc[]> {
    return (await this.collection())
      .find({ addresseeId: userId, status: "PENDING" })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async listOutgoing(userId: string): Promise<FriendshipDoc[]> {
    return (await this.collection())
      .find({ requesterId: userId, status: "PENDING" })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async listAccepted(userId: string): Promise<FriendshipDoc[]> {
    return (await this.collection())
      .find({
        status: "ACCEPTED",
        $or: [{ requesterId: userId }, { addresseeId: userId }],
      })
      .sort({ updatedAt: -1 })
      .toArray();
  }
}
