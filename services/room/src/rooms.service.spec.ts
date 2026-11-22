import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import type { RoomsRedisClient } from "./health.controller";
import type { RoomInvitesRepository } from "./invites/room-invites.repository";

describe("RoomsService", () => {
  let redis: jest.Mocked<RoomsRedisClient>;
  let service: RoomsService;
  let invites: jest.Mocked<
    Pick<
      RoomInvitesRepository,
      | "revokeForRoom"
      | "countPendingDirectInvites"
      | "createDirectInvite"
      | "createLinkInvite"
      | "findDirectInvite"
      | "findLinkInvite"
      | "markAccepted"
    >
  >;

  beforeEach(() => {
    invites = {
      revokeForRoom: jest.fn().mockResolvedValue(undefined),
      countPendingDirectInvites: jest.fn().mockResolvedValue(0),
      createDirectInvite: jest.fn(),
      createLinkInvite: jest.fn(),
      findDirectInvite: jest.fn().mockResolvedValue(null),
      findLinkInvite: jest.fn().mockResolvedValue(null),
      markAccepted: jest.fn().mockResolvedValue(undefined),
    };
    redis = {
      eval: jest.fn().mockResolvedValue(1),
      hget: jest.fn().mockResolvedValue(null),
      hgetall: jest.fn(),
      hlen: jest.fn().mockResolvedValue(1),
      hset: jest.fn(),
      ping: jest.fn(),
      ttl: jest.fn().mockResolvedValue(21_600),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrevrange: jest.fn(),
    };
    service = new RoomsService(
      redis,
      invites as unknown as RoomInvitesRepository,
    );
  });

  it("creates an active room with an online OWNER and accepted initial playback state", async () => {
    const created = await service.createRoom(" movie-1 ", "PUBLIC", "user-1");
    expect(created).toMatchObject({
      movieId: "movie-1",
      visibility: "PUBLIC",
    });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    const args = redis.eval.mock.calls[0];
    expect(args?.[0]).toContain("'status', 'ACTIVE'");
    expect(args?.[0]).toContain("'playbackStatus', 'PAUSED'");
    expect(args?.[0]).toContain("'positionSeconds', '0'");
    expect(JSON.parse(String(args?.[10])).role).toBe("OWNER");
    expect(JSON.parse(String(args?.[10])).presence).toBe("ONLINE");
    expect(args?.slice(1, 4)).toEqual([
      3,
      `room:${created.id}`,
      `room:${created.id}:members`,
    ]);
    expect(args?.[11]).toBe(String(6 * 60 * 60));
  });

  it("rejects invalid room inputs and missing authenticated identity", async () => {
    await expect(service.createRoom("", "PRIVATE", "user-1")).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.createRoom("movie-1", "PUBLIC", undefined),
    ).rejects.toThrow(ForbiddenException);
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("lists active public rooms with the current membership count", async () => {
    redis.zrevrange.mockResolvedValue(["room-1", "stale"]);
    redis.hgetall
      .mockResolvedValueOnce({
        id: "room-1",
        movieId: "movie-1",
        visibility: "PUBLIC",
        status: "ACTIVE",
      })
      .mockResolvedValueOnce({});
    redis.hlen.mockResolvedValue(3);

    await expect(service.listPublicRooms()).resolves.toEqual([
      {
        id: "room-1",
        movieId: "movie-1",
        visibility: "PUBLIC",
        memberCount: 3,
      },
    ]);
    expect(redis.zrem).toHaveBeenCalledWith("rooms:public", "stale");
  });

  it("lists members and derives presence only for an active room member", async () => {
    const ownerId = "e080c5e5-440e-4140-9617-a526748669d1";
    const viewerId = "3f8632a5-0bb2-46e6-8c34-0efad23a4d86";
    redis.hgetall
      .mockResolvedValueOnce({
        id: "b8c9dbfa-8ec0-4500-a47c-a708d4983332",
        movieId: "movie-1",
        visibility: "PRIVATE",
        status: "ACTIVE",
        ownerId,
      })
      .mockResolvedValueOnce({
        [ownerId]: JSON.stringify({
          userId: ownerId,
          role: "OWNER",
          lastHeartbeatAt: Date.now(),
        }),
        [viewerId]: JSON.stringify({
          userId: viewerId,
          role: "VIEWER",
          lastHeartbeatAt: Date.now() - 80_000,
        }),
      });

    await expect(
      service.getRoomMembers("b8c9dbfa-8ec0-4500-a47c-a708d4983332", ownerId),
    ).resolves.toMatchObject({
      ownerId,
      currentUserRole: "OWNER",
      members: [
        { userId: ownerId, role: "OWNER", presence: "ONLINE" },
        { userId: viewerId, role: "VIEWER", presence: "OFFLINE" },
      ],
    });
    expect(redis.ttl).toHaveBeenCalledWith(
      "room:b8c9dbfa-8ec0-4500-a47c-a708d4983332",
    );
  });

  it("does not disclose members to a non-member", async () => {
    redis.hgetall
      .mockResolvedValueOnce({ id: "room-1", status: "ACTIVE" })
      .mockResolvedValueOnce({});
    await expect(
      service.getRoomMembers(
        "b8c9dbfa-8ec0-4500-a47c-a708d4983332",
        "e080c5e5-440e-4140-9617-a526748669d1",
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("allows only the owner to close a room and applies the 15 minute grace TTL", async () => {
    await service.closeRoom("room-1", "owner-1");
    expect(redis.eval.mock.calls[0]?.[0]).toContain("'status', 'CLOSED'");
    expect(redis.eval.mock.calls[0]?.[1]).toBe(3);
    expect(redis.eval.mock.calls[0]?.[8]).toBe(String(15 * 60));
    expect(invites.revokeForRoom).toHaveBeenCalledWith("room-1");

    redis.eval.mockResolvedValueOnce(-1);
    await expect(service.closeRoom("room-1", "other")).rejects.toThrow(
      ForbiddenException,
    );
    redis.eval.mockResolvedValueOnce(0);
    await expect(service.closeRoom("missing", "owner-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("stores direct invites and ROOM_INVITED through the repository as VIEWER", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    const ownerId = "123e4567-e89b-42d3-a456-426614174001";
    const recipientId = "123e4567-e89b-42d3-a456-426614174002";
    redis.hgetall.mockResolvedValue({
      id: roomId,
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
    });
    invites.createDirectInvite.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174003",
      room_id: roomId,
      inviter_id: ownerId,
      recipient_id: recipientId,
      role: "VIEWER",
      status: "PENDING",
      expires_at: new Date(Date.now() + 60_000),
    });

    await service.createDirectInvite(roomId, recipientId, ownerId);
    expect(invites.createDirectInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId,
        inviterId: ownerId,
        recipientId,
        availableSlots: 19,
        event: expect.objectContaining({
          type: "ROOM_INVITED",
          recipientId,
          payload: { roomId, fromUserId: ownerId },
        }),
      }),
    );
  });

  it("rejects direct invites when the room is full", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    const ownerId = "123e4567-e89b-42d3-a456-426614174001";
    redis.hgetall.mockResolvedValue({
      id: roomId,
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
    });
    redis.hlen.mockResolvedValue(20);

    await expect(
      service.createDirectInvite(
        roomId,
        "123e4567-e89b-42d3-a456-426614174002",
        ownerId,
      ),
    ).rejects.toThrow(ConflictException);
    expect(invites.createDirectInvite).not.toHaveBeenCalled();
  });

  it("returns a private invite token while persisting only its SHA-256 hash", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    const ownerId = "123e4567-e89b-42d3-a456-426614174001";
    redis.hgetall.mockResolvedValue({
      id: roomId,
      ownerId,
      visibility: "PRIVATE",
      status: "ACTIVE",
    });
    invites.createLinkInvite.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174003",
      room_id: roomId,
      inviter_id: ownerId,
      role: "VIEWER",
      expires_at: new Date(Date.now() + 60_000),
    });

    const result = await service.createInviteLink(roomId, ownerId);
    expect(result.inviteToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const saved = invites.createLinkInvite.mock.calls[0]?.[0];
    expect(saved?.tokenHash).toHaveLength(32);
    expect(saved?.tokenHash.toString("base64url")).not.toBe(result.inviteToken);
    expect(saved?.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 21_600_000,
    );
  });

  it("accepts a private link invite as a VIEWER and creates the Redis membership", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    const userId = "123e4567-e89b-42d3-a456-426614174001";
    const token = "opaque-invite-token";
    redis.hgetall.mockResolvedValue({
      id: roomId,
      ownerId: "123e4567-e89b-42d3-a456-426614174003",
      visibility: "PRIVATE",
      status: "ACTIVE",
    });
    invites.findLinkInvite.mockResolvedValue({
      id: "123e4567-e89b-42d3-a456-426614174004",
      room_id: roomId,
      inviter_id: "123e4567-e89b-42d3-a456-426614174003",
      role: "VIEWER",
      expires_at: new Date(Date.now() + 60_000),
    });

    await expect(service.acceptInvite(roomId, token, userId)).resolves.toEqual({
      roomId,
      userId,
      role: "VIEWER",
    });
    expect(invites.findLinkInvite).toHaveBeenCalledWith(
      roomId,
      expect.any(Buffer),
    );
    const call = redis.eval.mock.calls[0];
    expect(call?.[0]).toContain("redis.call('HLEN', KEYS[2])");
    expect(call?.slice(1, 4)).toEqual([
      2,
      `room:${roomId}`,
      `room:${roomId}:members`,
    ]);
    expect(call?.[4]).toBe(userId);
    expect(JSON.parse(String(call?.[5]))).toMatchObject({
      userId,
      role: "VIEWER",
    });
    expect(call?.[6]).toBe("20");
  });

  it("does not join a private room by ID without an invite", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    redis.hgetall.mockResolvedValue({
      id: roomId,
      ownerId: "123e4567-e89b-42d3-a456-426614174003",
      visibility: "PRIVATE",
      status: "ACTIVE",
    });

    await expect(
      service.acceptInvite(
        roomId,
        undefined,
        "123e4567-e89b-42d3-a456-426614174001",
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("updates member permissions only through owner-authorized atomic Redis script", async () => {
    const roomId = "123e4567-e89b-42d3-a456-426614174000";
    const ownerId = "123e4567-e89b-42d3-a456-426614174001";
    const memberId = "123e4567-e89b-42d3-a456-426614174002";
    await service.changeMemberRole(roomId, memberId, "CONTROLLER", ownerId);
    expect(redis.eval.mock.calls[0]?.[0]).toContain(
      "redis.call('HGET', KEYS[1], 'ownerId') ~= ARGV[1]",
    );
    expect(redis.eval.mock.calls[0]?.slice(1, 4)).toEqual([
      2,
      `room:${roomId}`,
      `room:${roomId}:members`,
    ]);
    expect(redis.eval.mock.calls[0]?.slice(4)).toEqual([
      ownerId,
      memberId,
      "CONTROLLER",
    ]);

    redis.eval.mockResolvedValueOnce(-3);
    await expect(
      service.changeMemberRole(roomId, memberId, "CONTROLLER", memberId),
    ).rejects.toThrow(ForbiddenException);
  });
});
