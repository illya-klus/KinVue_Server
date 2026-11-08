import { notificationEventSchema } from "@kinvue/contracts";
import { AppError } from "@kinvue/errors";
import { register } from "prom-client";
import { FriendshipsService } from "./friendships.service";
import { FriendshipConflictError } from "./friendships.repository";
import type { FriendshipDoc } from "./friendships.types";

const A = "550e8400-e29b-41d4-a716-446655440001";
const B = "550e8400-e29b-41d4-a716-446655440002";
const FID = "550e8400-e29b-41d4-a716-446655440009";

function doc(over: Partial<FriendshipDoc> = {}): FriendshipDoc {
  return {
    _id: FID,
    pairKey: `${A}:${B}`,
    requesterId: A,
    addresseeId: B,
    status: "PENDING",
    createdAt: new Date("2026-11-08T09:00:00.000Z"),
    updatedAt: new Date("2026-11-08T09:00:00.000Z"),
    ...over,
  };
}

function setup() {
  const friendships = {
    createPending: jest.fn(),
    resolvePending: jest.fn(),
    findById: jest.fn(),
    listIncoming: jest.fn(),
    listOutgoing: jest.fn(),
    listAccepted: jest.fn(),
  };
  const users = { findById: jest.fn(), findManyByIds: jest.fn() };
  const logger = { error: jest.fn() };
  const publisher = { publish: jest.fn().mockResolvedValue(undefined) };
  const service = new FriendshipsService(
    friendships as never,
    users as never,
    logger as never,
    publisher,
  );
  return { service, friendships, users, logger, publisher };
}

async function metric(name: string, labels: Record<string, string>) {
  const found = (await register.getMetricsAsJSON()).find(
    (m) => m.name === name,
  );
  const value = found?.values.find((v) =>
    Object.entries(labels).every(([k, val]) => v.labels[k] === val),
  );
  return value?.value ?? 0;
}

describe("FriendshipsService", () => {
  it("publishes a schema-valid FRIEND_REQUEST_CREATED to the target and counts it", async () => {
    const { service, friendships, users, publisher } = setup();
    users.findById.mockResolvedValue({ _id: B });
    friendships.createPending.mockResolvedValue(doc());
    const before = await metric("users_friendship_operations_total", {
      operation: "request_sent",
    });

    const row = await service.sendRequest(A, { targetUserId: B });

    expect(row).toMatchObject({ id: FID, fromUserId: A, toUserId: B });
    const event = publisher.publish.mock.calls[0][0];
    expect(notificationEventSchema.parse(event)).toMatchObject({
      type: "FRIEND_REQUEST_CREATED",
      producer: "users",
      recipientId: B,
      payload: { friendshipId: FID, fromUserId: A },
    });
    expect(
      await metric("users_friendship_operations_total", {
        operation: "request_sent",
      }),
    ).toBe(before + 1);
  });

  it("rejects self requests, unknown targets and duplicates without publishing", async () => {
    const { service, friendships, users, publisher } = setup();
    await expect(
      service.sendRequest(A, { targetUserId: A }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await expect(service.sendRequest(A, {})).rejects.toBeInstanceOf(AppError);
    users.findById.mockResolvedValueOnce(null);
    await expect(
      service.sendRequest(A, { targetUserId: B }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    users.findById.mockResolvedValue({ _id: B });
    friendships.createPending.mockRejectedValue(new FriendshipConflictError());
    await expect(
      service.sendRequest(A, { targetUserId: B }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("does not fail the request when the broker is down", async () => {
    const { service, friendships, users, publisher, logger } = setup();
    users.findById.mockResolvedValue({ _id: B });
    friendships.createPending.mockResolvedValue(doc());
    publisher.publish.mockRejectedValue(new Error("ECONNREFUSED secret-host"));

    await expect(
      service.sendRequest(A, { targetUserId: B }),
    ).resolves.toMatchObject({ id: FID });
    expect(logger.error).toHaveBeenCalled();
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      "secret-host",
    );
  });

  it("accept notifies the original requester from the accepter", async () => {
    const { service, friendships, publisher } = setup();
    friendships.resolvePending.mockResolvedValue(doc({ status: "ACCEPTED" }));

    const row = await service.accept(B, FID);

    expect(friendships.resolvePending).toHaveBeenCalledWith(FID, B, "ACCEPTED");
    expect(row.status).toBe("ACCEPTED");
    expect(
      notificationEventSchema.parse(publisher.publish.mock.calls[0][0]),
    ).toMatchObject({
      type: "FRIEND_REQUEST_ACCEPTED",
      recipientId: A,
      payload: { friendshipId: FID, fromUserId: B },
    });
  });

  it("returns 404 for non-addressees and 409 for already-resolved requests", async () => {
    const { service, friendships, publisher } = setup();
    friendships.resolvePending.mockResolvedValue(null);
    friendships.findById.mockResolvedValueOnce(null);
    await expect(service.accept(B, FID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    friendships.findById.mockResolvedValueOnce(doc());
    await expect(service.accept(A, FID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    friendships.findById.mockResolvedValueOnce(doc({ status: "ACCEPTED" }));
    await expect(service.reject(B, FID)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("reject does not publish", async () => {
    const { service, friendships, publisher } = setup();
    friendships.resolvePending.mockResolvedValue(doc({ status: "REJECTED" }));
    await expect(service.reject(B, FID)).resolves.toMatchObject({
      status: "REJECTED",
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("lists friends as the other party's profile", async () => {
    const { service, friendships, users } = setup();
    friendships.listAccepted.mockResolvedValue([doc({ status: "ACCEPTED" })]);
    users.findManyByIds.mockResolvedValue([
      { _id: A, username: "alice", displayName: "Alice" },
    ]);
    await expect(service.friends(B)).resolves.toEqual({
      items: [{ userId: A, username: "alice", displayName: "Alice" }],
    });
    expect(users.findManyByIds).toHaveBeenCalledWith([A]);
  });
});
