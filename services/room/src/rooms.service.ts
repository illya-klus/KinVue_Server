import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ROOMS_REDIS, type RoomsRedisClient } from "./health.controller";
import { RoomInvitesRepository } from "./invites/room-invites.repository";

const ROOM_TTL_SECONDS = 6 * 60 * 60;
const CLOSED_ROOM_TTL_SECONDS = 15 * 60;
const MAX_ROOM_MEMBERS = 20;
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
const JOIN_ROOM_SCRIPT = `
  if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
  if redis.call('HGET', KEYS[1], 'status') ~= 'ACTIVE' then return -2 end
  local existing = redis.call('HGET', KEYS[2], ARGV[1])
  if existing then return 1 end
  if redis.call('HLEN', KEYS[2]) >= tonumber(ARGV[3]) then return 0 end
  redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
  return 1
`;
const CHANGE_ROLE_SCRIPT = `
  if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
  if redis.call('HGET', KEYS[1], 'status') ~= 'ACTIVE' then return -2 end
  if redis.call('HGET', KEYS[1], 'ownerId') ~= ARGV[1] then return -3 end
  local member = redis.call('HGET', KEYS[2], ARGV[2])
  if not member then return 0 end
  local decoded = cjson.decode(member)
  if decoded.role == 'OWNER' then return -4 end
  decoded.role = ARGV[3]
  redis.call('HSET', KEYS[2], ARGV[2], cjson.encode(decoded))
  return 1
`;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RoomVisibility = "PRIVATE" | "PUBLIC";
export type RoomSummary = {
  id: string;
  movieId: string;
  visibility: RoomVisibility;
  memberCount: number;
};

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOMS_REDIS) private readonly redis: RoomsRedisClient,
    private readonly invites: RoomInvitesRepository,
  ) {}

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
    await this.invites.revokeForRoom(id);
  }

  async createDirectInvite(
    id: string,
    recipientId: unknown,
    inviterId: string | undefined,
  ) {
    const { state, ttl } = await this.getActiveRoom(id, inviterId, true);
    if (typeof recipientId !== "string" || !uuidPattern.test(recipientId)) {
      throw new BadRequestException("recipientId must be a UUID");
    }
    if (await this.redis.hget(this.membersKey(id), recipientId)) {
      throw new BadRequestException("User is already in the room");
    }
    const members = await this.redis.hlen(this.membersKey(id));
    if (members >= MAX_ROOM_MEMBERS) {
      throw new ConflictException("Room capacity reached");
    }
    const now = new Date();
    const event = {
      eventId: randomUUID(),
      type: "ROOM_INVITED" as const,
      producer: "rooms" as const,
      occurredAt: now.toISOString(),
      recipientId,
      payload: { roomId: id, fromUserId: inviterId! },
    };
    const invite = await this.invites.createDirectInvite({
      roomId: id,
      inviterId: inviterId!,
      recipientId,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      inviteId: randomUUID(),
      event,
      availableSlots: MAX_ROOM_MEMBERS - members,
    });
    return {
      id: invite.id,
      roomId: invite.room_id,
      recipientId: invite.recipient_id,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expires_at,
    };
  }

  async createInviteLink(id: string, inviterId: string | undefined) {
    const { state, ttl } = await this.getActiveRoom(id, inviterId, true);
    if (state.visibility !== "PRIVATE") {
      throw new BadRequestException("Invite links are for private rooms");
    }
    const members = await this.redis.hlen(this.membersKey(id));
    const pendingInvites = await this.invites.countPendingDirectInvites(id);
    if (members + pendingInvites >= MAX_ROOM_MEMBERS) {
      throw new ConflictException("Room capacity reached");
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await this.invites.createLinkInvite({
      roomId: id,
      inviterId: inviterId!,
      tokenHash: createHash("sha256").update(token).digest(),
      expiresAt,
      inviteId: randomUUID(),
    });
    return {
      roomId: id,
      inviteToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async acceptInvite(id: string, token: unknown, userId: string | undefined) {
    const { state } = await this.getActiveRoom(id, userId, false);
    const authenticatedId = userId!;
    const existing = await this.redis.hget(
      this.membersKey(id),
      authenticatedId,
    );
    let role: "VIEWER" | "CONTROLLER" = "VIEWER";
    let inviteId: string | undefined;
    if (existing) {
      const membership = JSON.parse(existing) as {
        role: "VIEWER" | "CONTROLLER" | "OWNER";
      };
      const directInvite = await this.invites.findDirectInvite(
        id,
        authenticatedId,
      );
      if (directInvite) await this.invites.markAccepted(directInvite.id);
      return { roomId: id, userId: authenticatedId, role: membership.role };
    }
    if (typeof token === "string" && token.length > 0 && token.length <= 128) {
      if (state.visibility !== "PRIVATE") {
        throw new BadRequestException("Invite links are for private rooms");
      }
      const invite = await this.invites.findLinkInvite(
        id,
        createHash("sha256").update(token).digest(),
      );
      if (!invite) throw new ForbiddenException("Valid invite required");
      role = invite.role;
    } else {
      const invite = await this.invites.findDirectInvite(id, authenticatedId);
      if (!invite) throw new ForbiddenException("Valid invite required");
      role = invite.role;
      inviteId = invite.id;
    }
    const now = Date.now();
    const member = JSON.stringify({
      userId: authenticatedId,
      role,
      presence: "ONLINE",
      joinedAt: new Date(now).toISOString(),
      lastHeartbeatAt: now,
    });
    const result = Number(
      await this.redis.eval(
        JOIN_ROOM_SCRIPT,
        2,
        this.roomKey(id),
        this.membersKey(id),
        authenticatedId,
        member,
        String(MAX_ROOM_MEMBERS),
      ),
    );
    if (result === -1) throw new NotFoundException("Room not found");
    if (result === -2) throw new BadRequestException("Room is closed");
    if (result === 0) throw new ConflictException("Room capacity reached");
    if (inviteId) await this.invites.markAccepted(inviteId);
    return { roomId: id, userId: authenticatedId, role };
  }

  async changeMemberRole(
    id: string,
    userId: unknown,
    role: unknown,
    ownerId: string | undefined,
  ) {
    if (!ownerId?.trim())
      throw new ForbiddenException("Authenticated user required");
    if (
      !uuidPattern.test(id) ||
      typeof userId !== "string" ||
      !uuidPattern.test(userId)
    ) {
      throw new BadRequestException("roomId and userId must be UUIDs");
    }
    if (role !== "VIEWER" && role !== "CONTROLLER") {
      throw new BadRequestException("role must be VIEWER or CONTROLLER");
    }
    const result = Number(
      await this.redis.eval(
        CHANGE_ROLE_SCRIPT,
        2,
        this.roomKey(id),
        this.membersKey(id),
        ownerId,
        userId,
        role,
      ),
    );
    if (result === -1) throw new NotFoundException("Room not found");
    if (result === -2) throw new BadRequestException("Room is closed");
    if (result === -3)
      throw new ForbiddenException("Only the owner can change permissions");
    if (result === -4)
      throw new BadRequestException("Owner role cannot be changed here");
    if (result === 0) throw new NotFoundException("Room member not found");
    return { roomId: id, userId, role };
  }

  private async getActiveRoom(
    id: string,
    userId: string | undefined,
    ownerOnly: boolean,
  ) {
    if (!userId?.trim())
      throw new ForbiddenException("Authenticated user required");
    if (!uuidPattern.test(id))
      throw new BadRequestException("room id is invalid");
    if (!uuidPattern.test(userId)) {
      throw new BadRequestException("Authenticated user id must be a UUID");
    }
    const state = await this.redis.hgetall(this.roomKey(id));
    if (!state.id) throw new NotFoundException("Room not found");
    if (state.status !== "ACTIVE")
      throw new BadRequestException("Room is closed");
    if (ownerOnly && state.ownerId !== userId) {
      throw new ForbiddenException("Only the owner can invite users");
    }
    const ttl = await this.redis.ttl(this.roomKey(id));
    if (ttl <= 0) throw new NotFoundException("Room not found");
    return { state, ttl };
  }

  private roomKey(id: string): string {
    return `room:${id}`;
  }

  private membersKey(id: string): string {
    return `room:${id}:members`;
  }
}
