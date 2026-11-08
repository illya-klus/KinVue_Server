import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AppError } from "@kinvue/errors";
import { type NotificationEvent, friendRequestSchema } from "@kinvue/contracts";
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
import {
  NOTIFICATION_PUBLISHER,
  type NotificationPublisher,
} from "../events/notification-publisher";
import { SharedLogger } from "../shared-logger";
import {
  usersFriendshipOps,
  usersNotificationPublishes,
} from "../users-observability.metrics";

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly friendships: FriendshipsRepository,
    private readonly users: UsersRepository,
    private readonly logger: SharedLogger,
    @Inject(NOTIFICATION_PUBLISHER)
    private readonly publisher: NotificationPublisher,
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
    await this.emit({
      type: "FRIEND_REQUEST_CREATED",
      producer: "users",
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      recipientId: targetId,
      payload: { friendshipId: doc._id, fromUserId: callerId },
    });
    return toRequestRow(doc);
  }

  async accept(callerId: string, id: string): Promise<FriendRequestRow> {
    const doc = await this.resolve(callerId, id, "ACCEPTED");
    usersFriendshipOps.inc({ operation: "request_accepted" });
    await this.emit({
      type: "FRIEND_REQUEST_ACCEPTED",
      producer: "users",
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      recipientId: doc.requesterId,
      payload: { friendshipId: doc._id, fromUserId: callerId },
    });
    return toRequestRow(doc);
  }

  async reject(callerId: string, id: string): Promise<FriendRequestRow> {
    const doc = await this.resolve(callerId, id, "REJECTED");
    usersFriendshipOps.inc({ operation: "request_rejected" });
    return toRequestRow(doc);
  }

  async incoming(callerId: string): Promise<{ items: FriendRequestRow[] }> {
    const docs = await this.friendships.listIncoming(callerId);
    usersFriendshipOps.inc({ operation: "list_incoming" });
    return { items: await this.withOtherUser(callerId, docs) };
  }

  async outgoing(callerId: string): Promise<{ items: FriendRequestRow[] }> {
    const docs = await this.friendships.listOutgoing(callerId);
    usersFriendshipOps.inc({ operation: "list_outgoing" });
    return { items: await this.withOtherUser(callerId, docs) };
  }

  async friends(callerId: string): Promise<{ items: FriendRow[] }> {
    const docs = await this.friendships.listAccepted(callerId);
    usersFriendshipOps.inc({ operation: "list_friends" });
    const otherIds = docs.map((d) => this.otherId(callerId, d));
    const profiles = new Map(
      (await this.users.findManyByIds(otherIds)).map((p) => [p._id, p]),
    );
    return {
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
    // Hide requests the caller is not the addressee of.
    if (!existing || existing.addresseeId !== callerId) {
      throw new AppError("NOT_FOUND", "Friend request not found");
    }
    throw new AppError("CONFLICT", "Friend request is no longer pending");
  }

  private otherId(callerId: string, doc: FriendshipDoc): string {
    return doc.requesterId === callerId ? doc.addresseeId : doc.requesterId;
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

  /**
   * Best-effort publish after the state change is committed. A broker outage
   * must not roll back or fail the friendship; failures are logged and counted
   * (no outbox yet, so the notification is lost in that case).
   */
  private async emit(event: NotificationEvent): Promise<void> {
    try {
      await this.publisher.publish(event);
      usersNotificationPublishes.inc({
        type: event.type,
        outcome: "published",
      });
    } catch (error) {
      usersNotificationPublishes.inc({ type: event.type, outcome: "failed" });
      this.logger.error("failed to publish notification event", {
        type: event.type,
        eventId: event.eventId,
        error: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }
}
