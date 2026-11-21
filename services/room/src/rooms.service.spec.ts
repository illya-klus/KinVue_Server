import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import type { RoomsRedisClient } from "./health.controller";

describe("RoomsService", () => {
  let redis: jest.Mocked<RoomsRedisClient>;
  let service: RoomsService;

  beforeEach(() => {
    redis = {
      eval: jest.fn().mockResolvedValue(1),
      hgetall: jest.fn(),
      hlen: jest.fn(),
      hset: jest.fn(),
      ping: jest.fn(),
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrevrange: jest.fn(),
    };
    service = new RoomsService(redis);
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

  it("allows only the owner to close a room and applies the 15 minute grace TTL", async () => {
    await service.closeRoom("room-1", "owner-1");
    expect(redis.eval.mock.calls[0]?.[0]).toContain("'status', 'CLOSED'");
    expect(redis.eval.mock.calls[0]?.[1]).toBe(3);
    expect(redis.eval.mock.calls[0]?.[8]).toBe(String(15 * 60));

    redis.eval.mockResolvedValueOnce(-1);
    await expect(service.closeRoom("room-1", "other")).rejects.toThrow(
      ForbiddenException,
    );
    redis.eval.mockResolvedValueOnce(0);
    await expect(service.closeRoom("missing", "owner-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});
