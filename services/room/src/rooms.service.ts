import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ROOMS_REDIS, type RoomsRedisClient } from "./health.controller";

const ROOM_TTL_SECONDS = 6 * 60 * 60;
const CLOSED_ROOM_TTL_SECONDS = 15 * 60;
const CREATE_ROOM_SCRIPT = `
  redis.call('HSET', KEYS[1],
    'id', ARGV[1], 'movieId', ARGV[2], 'visibility', ARGV[3],
    'ownerId', ARGV[4], 'status', 'ACTIVE', 'playbackStatus', 'PAUSED',
    'positionSeconds', '0', 'version', '0', 'createdAt', ARGV[5])
  redis.call('HSET', KEYS[2], ARGV[4], ARGV[6])
  redis.call('EXPIRE', KEYS[1], ARGV[7])
  redis.call('EXPIRE', KEYS[2], ARGV[7])
  if ARGV[3] == 'PUBLIC' then redis.call('ZADD', KEYS[3], ARGV[5], ARGV[1]) end
  return 1
`;
const CLOSE_ROOM_SCRIPT = `
  if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
  if redis.call('HGET', KEYS[1], 'ownerId') ~= ARGV[1] then return -1 end
  redis.call('HSET', KEYS[1], 'status', 'CLOSED', 'closedAt', ARGV[2])
  redis.call('ZREM', KEYS[3], ARGV[3])
  redis.call('EXPIRE', KEYS[1], ARGV[4])
  redis.call('EXPIRE', KEYS[2], ARGV[4])
  return 1
`;

export type RoomVisibility = "PRIVATE" | "PUBLIC";
export type RoomSummary = {
  id: string;
  movieId: string;
  visibility: RoomVisibility;
  memberCount: number;
};

@Injectable()
export class RoomsService {
  constructor(@Inject(ROOMS_REDIS) private readonly redis: RoomsRedisClient) {}

  async createRoom(
    movieId: unknown,
    visibility: unknown,
    ownerId: string | undefined,
  ): Promise<{ id: string; movieId: string; visibility: RoomVisibility }> {
    if (!ownerId?.trim()) {
      throw new ForbiddenException("Authenticated user required");
    }
    if (
      typeof movieId !== "string" ||
      !movieId.trim() ||
      movieId.length > 128
    ) {
      throw new BadRequestException("movieId must be a non-empty string");
    }
    if (visibility !== "PRIVATE" && visibility !== "PUBLIC") {
      throw new BadRequestException("visibility must be PRIVATE or PUBLIC");
    }

    const id = randomUUID();
    const createdAt = Date.now();
    const membership = JSON.stringify({
      userId: ownerId,
      role: "OWNER",
      presence: "ONLINE",
      joinedAt: new Date(createdAt).toISOString(),
      lastHeartbeatAt: createdAt,
    });
    await this.redis.eval(
      CREATE_ROOM_SCRIPT,
      3,
      this.roomKey(id),
      this.membersKey(id),
      "rooms:public",
      id,
      movieId.trim(),
      visibility,
      ownerId,
      String(createdAt),
      membership,
      String(ROOM_TTL_SECONDS),
    );
    return { id, movieId: movieId.trim(), visibility };
  }

  async listPublicRooms(): Promise<RoomSummary[]> {
    const ids = await this.redis.zrevrange("rooms:public", 0, 99);
    const rooms: RoomSummary[] = [];
    for (const id of ids) {
      const state = await this.redis.hgetall(this.roomKey(id));
      if (state.status !== "ACTIVE" || state.visibility !== "PUBLIC") {
        await this.redis.zrem("rooms:public", id);
        continue;
      }
      rooms.push({
        id,
        movieId: state.movieId,
        visibility: "PUBLIC",
        memberCount: await this.redis.hlen(this.membersKey(id)),
      });
    }
    return rooms;
  }

  async closeRoom(id: string, ownerId: string | undefined): Promise<void> {
    if (!ownerId?.trim()) {
      throw new ForbiddenException("Authenticated user required");
    }
    if (!id.trim() || id.length > 128) {
      throw new BadRequestException("room id is invalid");
    }
    const result = Number(
      await this.redis.eval(
        CLOSE_ROOM_SCRIPT,
        3,
        this.roomKey(id),
        this.membersKey(id),
        "rooms:public",
        ownerId,
        String(Date.now()),
        id,
        String(CLOSED_ROOM_TTL_SECONDS),
      ),
    );
    if (result === 0) throw new NotFoundException("Room not found");
    if (result === -1)
      throw new ForbiddenException("Only the owner can close a room");
  }

  private roomKey(id: string): string {
    return `room:${id}`;
  }

  private membersKey(id: string): string {
    return `room:${id}:members`;
  }
}
