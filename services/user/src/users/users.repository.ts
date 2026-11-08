import { Injectable } from "@nestjs/common";
import type { Collection } from "mongodb";
import {
  DEFAULT_PREFERENCES,
  type Preferences,
  type ProfileDoc,
} from "./users.types";
import { MongoService, isDuplicateKey } from "../mongo/mongo.service";

export type ProfileUpdate = {
  displayName?: string;
  avatarUrl?: string | null;
  preferences?: Partial<Preferences>;
};

export class UsernameTakenError extends Error {}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

@Injectable()
export class UsersRepository {
  private collectionPromise?: Promise<Collection<ProfileDoc>>;

  constructor(private readonly mongo: MongoService) {}

  /** Indexes are created on first use so boot does not require MongoDB. */
  private collection(): Promise<Collection<ProfileDoc>> {
    this.collectionPromise ??= (async () => {
      const col = (await this.mongo.db()).collection<ProfileDoc>("profiles");
      await col.createIndex({ username: 1 }, { unique: true });
      return col;
    })().catch((error: unknown) => {
      this.collectionPromise = undefined;
      throw error;
    });
    return this.collectionPromise;
  }

  async findById(userId: string): Promise<ProfileDoc | null> {
    return (await this.collection()).findOne({ _id: userId });
  }

  async findManyByIds(ids: string[]): Promise<ProfileDoc[]> {
    if (ids.length === 0) return [];
    return (await this.collection()).find({ _id: { $in: ids } }).toArray();
  }

  /** Idempotent for the same userId; throws UsernameTakenError on collision. */
  async create(input: {
    userId: string;
    username: string;
    displayName: string;
  }): Promise<{ doc: ProfileDoc; created: boolean }> {
    const col = await this.collection();
    const existing = await col.findOne({ _id: input.userId });
    if (existing) return { doc: existing, created: false };
    const now = new Date();
    const doc: ProfileDoc = {
      _id: input.userId,
      username: input.username,
      displayName: input.displayName,
      avatarUrl: null,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: now,
      updatedAt: now,
    };
    try {
      await col.insertOne(doc);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const raced = await col.findOne({ _id: input.userId });
      if (raced) return { doc: raced, created: false };
      throw new UsernameTakenError();
    }
    return { doc, created: true };
  }

  async update(
    userId: string,
    patch: ProfileUpdate,
  ): Promise<ProfileDoc | null> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.displayName !== undefined) set.displayName = patch.displayName;
    if (patch.avatarUrl !== undefined) set.avatarUrl = patch.avatarUrl;
    for (const key of ["genres", "languages", "autoplay"] as const) {
      const value = patch.preferences?.[key];
      if (value !== undefined) set[`preferences.${key}`] = value;
    }
    return (await this.collection()).findOneAndUpdate(
      { _id: userId },
      { $set: set },
      { returnDocument: "after" },
    );
  }

  /** Prefix match on username/displayName, ordered by username, keyset cursor. */
  async search(params: {
    query: string;
    excludeUserId: string;
    limit: number;
    afterUsername?: string;
  }): Promise<ProfileDoc[]> {
    const prefix = new RegExp(`^${escapeRegex(params.query)}`, "i");
    const filter: Record<string, unknown> = {
      _id: { $ne: params.excludeUserId },
      $or: [{ username: prefix }, { displayName: prefix }],
    };
    if (params.afterUsername !== undefined) {
      filter.username = { $gt: params.afterUsername };
    }
    return (await this.collection())
      .find(filter)
      .sort({ username: 1 })
      .limit(params.limit)
      .toArray();
  }
}
