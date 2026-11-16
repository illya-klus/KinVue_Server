import { Injectable } from "@nestjs/common";
import { AppError } from "@kinvue/errors";
import { friendRequestSchema } from "@kinvue/contracts";
import {
  FriendshipConflictError,
  FriendshipsRepository,
} from "./friendships.repository";
import {
  type FriendRequestRow,
  type FriendRow,
  type FriendshipDoc,
  toRequestRow,
} from "./friendships.types";
import { UsersRepository } from "../users/users.repository";
import { type PageQuery, pageOptions, splitPage } from "../mongo/pagination";
import { usersFriendshipOps } from "../users-observability.metrics";

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly friendships: FriendshipsRepository,
    private readonly users: UsersRepository,
  ) {}

  async sendRequest(
    callerId: string,
    body: unknown,
  ): Promise<FriendRequestRow> {
    const parsed = friendRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_FAILED", "Validation failed");
    }
    const targetId = parsed.data.targetUserId.toLowerCase();
    if (targetId === callerId) {
      throw new AppError(
        "VALIDATION_FAILED",
        "Cannot send a friend request to yourself",
      );
    }
    if (!(await this.users.findById(targetId))) {
      throw new AppError("NOT_FOUND", "User not found");
    }
    let doc: FriendshipDoc;
    try {
      doc = await this.friendships.createPending(callerId, targetId);
    } catch (error) {
      if (error instanceof FriendshipConflictError) {
        throw new AppError(
          "CONFLICT",
          "A friend request or friendship already exists",
        );
      }
      throw error;
    }
    usersFriendshipOps.inc({ operation: "request_sent" });
    return toRequestRow(doc);
  }

  async accept(callerId: string, id: string): Promise<FriendRequestRow> {
    const doc = await this.resolve(callerId, id, "ACCEPTED");
    usersFriendshipOps.inc({ operation: "request_accepted" });
    return toRequestRow(doc);
  }

  async reject(callerId: string, id: string): Promise<FriendRequestRow> {
    const doc = await this.resolve(callerId, id, "REJECTED");
    usersFriendshipOps.inc({ operation: "request_rejected" });
    return toRequestRow(doc);
  }

  async incoming(callerId: string, query: PageQuery) {
    const page = pageOptions(query);
    const { items, nextCursor } = splitPage(
      await this.friendships.listIncoming(callerId, page),
      page.limit,
    );
    usersFriendshipOps.inc({ operation: "list_incoming" });
    return { items: await this.withOtherUser(callerId, items), nextCursor };
  }

  async outgoing(callerId: string, query: PageQuery) {
    const page = pageOptions(query);
    const { items, nextCursor } = splitPage(
      await this.friendships.listOutgoing(callerId, page),
      page.limit,
    );
    usersFriendshipOps.inc({ operation: "list_outgoing" });
    return { items: await this.withOtherUser(callerId, items), nextCursor };
  }

  async friends(
    callerId: string,
    query: PageQuery,
  ): Promise<{ items: FriendRow[]; nextCursor: string | null }> {
    const page = pageOptions(query);
    const { items: docs, nextCursor } = splitPage(
      await this.friendships.listAccepted(callerId, page),
      page.limit,
    );
    usersFriendshipOps.inc({ operation: "list_friends" });
    const otherIds = docs
      .map((d) => this.otherId(callerId, d))
      .filter((id) => id !== callerId);
    const profiles = new Map(
      (await this.users.findManyByIds(otherIds)).map((p) => [p._id, p]),
    );
    return {
      nextCursor,
      items: otherIds.flatMap((userId) => {
        const profile = profiles.get(userId);
        return profile
          ? [
              {
                userId,
                username: profile.username,
                displayName: profile.displayName,
              },
            ]
          : [];
      }),
    };
  }

  private async resolve(
    callerId: string,
    id: string,
    status: "ACCEPTED" | "REJECTED",
  ): Promise<FriendshipDoc> {
    const updated = await this.friendships.resolvePending(id, callerId, status);
    if (updated) return updated;
    const existing = await this.friendships.findById(id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Friend request not found");
    }
    if (existing.addresseeId !== callerId) {
      throw new AppError(
        "FORBIDDEN",
        "Only the addressee may resolve the request",
      );
    }
    throw new AppError("CONFLICT", "Friend request is no longer pending");
  }

  private otherId(callerId: string, doc: FriendshipDoc): string {
    return doc.requestedBy === callerId ? doc.addresseeId : doc.requestedBy;
  }

  private async withOtherUser(
    callerId: string,
    docs: FriendshipDoc[],
  ): Promise<FriendRequestRow[]> {
    const profiles = new Map(
      (
        await this.users.findManyByIds(
          docs.map((d) => this.otherId(callerId, d)),
        )
      ).map((p) => [p._id, p]),
    );
    return docs.map((doc) => {
      const row = toRequestRow(doc);
      const other = profiles.get(this.otherId(callerId, doc));
      return other
        ? {
            ...row,
            otherUser: {
              userId: other._id,
              username: other.username,
              displayName: other.displayName,
            },
          }
        : row;
    });
  }
}
