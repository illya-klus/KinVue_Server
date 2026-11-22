import { randomUUID } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { RoomsDatabaseService } from "../database/rooms-database.service";
import { RoomInvitesRepository } from "../invites/room-invites.repository";
import { ScheduledRoomsRepository } from "./scheduled-rooms.repository";

const testDatabaseUrl = process.env["ROOMS_DATABASE_URL"];
const testRedisUrl = process.env["ROOMS_TEST_REDIS_URL"];
const integration = testDatabaseUrl && testRedisUrl ? describe : describe.skip;

integration("ScheduledRoomsRepository persistence", () => {
  let database: RoomsDatabaseService;
  let redis: Redis;
  let repository: ScheduledRoomsRepository;

  beforeAll(async () => {
    jest.setTimeout(20_000);
    database = new RoomsDatabaseService(
      new ConfigService({ ROOMS_DATABASE_URL: testDatabaseUrl }),
    );
    await database.onModuleInit();
    redis = new Redis(testRedisUrl!, { lazyConnect: true });
    await redis.connect();
    repository = new ScheduledRoomsRepository(database);
  });

  afterAll(async () => {
    await redis?.quit();
    await database?.onModuleDestroy();
  });

  it("keeps the schedule and invitees after the isolated Redis database is flushed", async () => {
    const scheduledRoomId = randomUUID();
    const roomId = randomUUID();
    const ownerId = randomUUID();
    const movieId = randomUUID();
    const inviteeIds = [randomUUID(), randomUUID()];
    const scheduledFor = new Date(Date.now() + 60 * 60 * 1000);

    try {
      const created = await repository.create({
        scheduledRoomId,
        roomId,
        ownerId,
        movieId,
        visibility: "PRIVATE",
        scheduledFor,
        inviteeIds,
      });
      await redis.set(
        `scheduled-room:${scheduledRoomId}`,
        "volatile projection",
      );
      await redis.flushdb();

      const persisted = await repository.findById(scheduledRoomId);
      expect(persisted).toMatchObject({
        ...created,
        scheduledRoomId,
        roomId,
        ownerId,
        movieId,
        visibility: "PRIVATE",
        status: "SCHEDULED",
        inviteeIds: expect.arrayContaining(inviteeIds),
      });
      expect(persisted?.scheduledFor.toISOString()).toBe(
        scheduledFor.toISOString(),
      );
      expect(await redis.get(`scheduled-room:${scheduledRoomId}`)).toBeNull();
    } finally {
      await database.query(
        "DELETE FROM scheduled_rooms WHERE scheduled_room_id = $1",
        [scheduledRoomId],
      );
    }
  });

  it("opens due schedules once, preserves SCHEDULED on Redis failure, and enqueues invites", async () => {
    const scheduledRoomId = randomUUID();
    const roomId = randomUUID();
    const ownerId = randomUUID();
    const movieId = randomUUID();
    const inviteeIds = [randomUUID(), randomUUID()];
    try {
      await repository.create({
        scheduledRoomId,
        roomId,
        ownerId,
        movieId,
        visibility: "PRIVATE",
        scheduledFor: new Date(Date.now() - 1000),
        inviteeIds,
      });

      await expect(
        repository.openDue(async () => {
          throw new Error("Redis unavailable");
        }),
      ).rejects.toThrow("Redis unavailable");
      expect((await repository.findById(scheduledRoomId))?.status).toBe(
        "SCHEDULED",
      );

      const opened = await repository.openDue(async (schedule) => {
        await redis.hset(
          `room:${schedule.roomId}`,
          "id",
          schedule.roomId,
          "movieId",
          schedule.movieId,
          "visibility",
          schedule.visibility,
          "ownerId",
          schedule.ownerId,
          "status",
          "ACTIVE",
        );
      });
      expect(opened).toBe(1);
      expect((await repository.findById(scheduledRoomId))?.status).toBe(
        "OPENED",
      );
      expect(await redis.hget(`room:${roomId}`, "status")).toBe("ACTIVE");
      expect(
        await database.query(
          "SELECT id FROM room_invites WHERE room_id = $1 AND status = 'PENDING'",
          [roomId],
        ),
      ).toMatchObject({ rowCount: inviteeIds.length });
      expect(
        await database.query(
          "SELECT event_id FROM rooms_outbox_events WHERE payload->'payload'->>'roomId' = $1",
          [roomId],
        ),
      ).toMatchObject({ rowCount: inviteeIds.length });
      const published: Array<{
        recipientId: string;
        payload: { roomId: string; fromUserId: string };
      }> = [];
      await new RoomInvitesRepository(database).publishPending(
        async (event) => {
          published.push(event);
        },
      );
      expect(
        published.filter((event) => event.payload.roomId === roomId),
      ).toEqual(
        expect.arrayContaining(
          inviteeIds.map((recipientId) =>
            expect.objectContaining({
              recipientId,
              payload: { roomId, fromUserId: ownerId },
            }),
          ),
        ),
      );
      await expect(
        repository.openDue(async () => {
          throw new Error("must not run twice");
        }),
      ).resolves.toBe(0);
    } finally {
      await database.query(
        "DELETE FROM scheduled_rooms WHERE scheduled_room_id = $1",
        [scheduledRoomId],
      );
      await database.query("DELETE FROM room_invites WHERE room_id = $1", [
        roomId,
      ]);
      await database.query(
        "DELETE FROM rooms_outbox_events WHERE payload->'payload'->>'roomId' = $1",
        [roomId],
      );
      await redis.del(
        `room:${roomId}`,
        `room:${roomId}:members`,
        "rooms:public",
      );
    }
  });

  it("does not open a cancelled schedule after its scheduled time", async () => {
    const scheduledRoomId = randomUUID();
    const roomId = randomUUID();
    try {
      await repository.create({
        scheduledRoomId,
        roomId,
        ownerId: randomUUID(),
        movieId: randomUUID(),
        visibility: "PUBLIC",
        scheduledFor: new Date(Date.now() - 1000),
        inviteeIds: [],
      });
      await repository.cancel(scheduledRoomId);
      expect((await repository.findById(scheduledRoomId))?.status).toBe(
        "CANCELLED",
      );
      await expect(
        repository.openDue(async () => {
          throw new Error("cancelled schedule must not open");
        }),
      ).resolves.toBe(0);
      expect(await redis.exists(`room:${roomId}`)).toBe(0);
    } finally {
      await database.query(
        "DELETE FROM scheduled_rooms WHERE scheduled_room_id = $1",
        [scheduledRoomId],
      );
      await redis.del(`room:${roomId}`, `room:${roomId}:members`);
    }
  });
});
