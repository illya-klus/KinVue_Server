import { AppError } from "@kinvue/errors";
import { FriendshipsService } from "./friendships.service";
import { FriendshipConflictError } from "./friendships.repository";
import { normalizeFriendshipPair } from "./friendships.types";

const A = "550e8400-e29b-41d4-a716-446655440001";
const B = "550e8400-e29b-41d4-a716-446655440002";
const C = "550e8400-e29b-41d4-a716-446655440003";
const FID = "550e8400-e29b-41d4-a716-446655440009";

function setup() {
  const friendships = {
    createPending: jest.fn(),
    resolvePending: jest.fn(),
    findById: jest.fn(),
  };
  const users = { findById: jest.fn() };
  return {
    service: new FriendshipsService(friendships as never, users as never),
    friendships,
    users,
  };
}

it("normalizes reversed pairs and maps invalid, unknown and duplicate targets", async () => {
  const { service, friendships, users } = setup();
  expect(normalizeFriendshipPair(B, A)).toEqual({ user1Id: A, user2Id: B });
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
});

it.each(["accept", "reject"] as const)(
  "restricts %s to the addressee",
  async (method) => {
    const { service, friendships } = setup();
    friendships.resolvePending.mockResolvedValue(null);
    friendships.findById.mockResolvedValueOnce(null);
    await expect(service[method](B, FID)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    friendships.findById.mockResolvedValue({ addresseeId: B });
    for (const caller of [A, C]) {
      await expect(service[method](caller, FID)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
    await expect(service[method](B, FID)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  },
);
