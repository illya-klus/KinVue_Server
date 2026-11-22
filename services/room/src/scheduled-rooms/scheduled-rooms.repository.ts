import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { RoomsDatabaseService } from "../database/rooms-database.service";

export type ScheduledRoomStatus = "SCHEDULED" | "OPENED" | "CANCELLED";
export type ScheduledRoomVisibility = "PRIVATE" | "PUBLIC";

export type ScheduledRoom = {
  scheduledRoomId: string;
  roomId: string;
  ownerId: string;
  movieId: string;
  visibility: ScheduledRoomVisibility;
  scheduledFor: Date;
  status: ScheduledRoomStatus;
  createdAt: Date;
  updatedAt: Date;
  inviteeIds: string[];
};

type ScheduledRoomRow = {
  scheduled_room_id: string;
  room_id: string;
  owner_id: string;
  movie_id: string;
  visibility: ScheduledRoomVisibility;
  scheduled_for: Date;
  status: ScheduledRoomStatus;
  created_at: Date;
  updated_at: Date;
  invitee_ids: string[];
};

@Injectable()
export class ScheduledRoomsRepository {
  constructor(private readonly database: RoomsDatabaseService) {}

  async create(input: {
    scheduledRoomId: string;
    roomId: string;
    ownerId: string;
    movieId: string;
    visibility: ScheduledRoomVisibility;
    scheduledFor: Date;
    inviteeIds: readonly string[];
  }): Promise<ScheduledRoom> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO scheduled_rooms
           (scheduled_room_id, room_id, owner_id, movie_id, visibility, scheduled_for)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          input.scheduledRoomId,
          input.roomId,
          input.ownerId,
          input.movieId,
          input.visibility,
          input.scheduledFor,
        ],
      );

      const inviteeIds = [...new Set(input.inviteeIds)];
      if (inviteeIds.length > 0) {
        await client.query(
          `INSERT INTO scheduled_room_invitees (scheduled_room_id, user_id)
           SELECT $1, invitees.user_id
           FROM unnest($2::uuid[]) AS invitees(user_id)
           ON CONFLICT (scheduled_room_id, user_id) DO NOTHING`,
          [input.scheduledRoomId, inviteeIds],
        );
      }

      const result = await client.query<ScheduledRoomRow>(
        `${this.selectByIdSql()} WHERE scheduled.scheduled_room_id = $1
         GROUP BY scheduled.scheduled_room_id`,
        [input.scheduledRoomId],
      );
      await client.query("COMMIT");
      const row = result.rows[0];
      if (!row) throw new Error("Scheduled room insert was not readable");
      return this.toScheduledRoom(row);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(scheduledRoomId: string): Promise<ScheduledRoom | null> {
    const result = await this.database.query<ScheduledRoomRow>(
      `${this.selectByIdSql()} WHERE scheduled.scheduled_room_id = $1
       GROUP BY scheduled.scheduled_room_id`,
      [scheduledRoomId],
    );
    const row = result.rows[0];
    return row ? this.toScheduledRoom(row) : null;
  }

  async listByOwner(ownerId: string): Promise<ScheduledRoom[]> {
    const result = await this.database.query<ScheduledRoomRow>(
      `${this.selectByIdSql()} WHERE scheduled.owner_id = $1
       GROUP BY scheduled.scheduled_room_id
       ORDER BY scheduled.scheduled_for, scheduled.scheduled_room_id`,
      [ownerId],
    );
    return result.rows.map((row) => this.toScheduledRoom(row));
  }

  async cancel(scheduledRoomId: string): Promise<ScheduledRoom | null> {
    const result = await this.database.query<{ scheduled_room_id: string }>(
      `UPDATE scheduled_rooms
       SET status = 'CANCELLED', updated_at = now()
       WHERE scheduled_room_id = $1 AND status = 'SCHEDULED'
       RETURNING scheduled_room_id`,
      [scheduledRoomId],
    );
    return result.rowCount ? this.findById(scheduledRoomId) : null;
  }

  async openDue(
    openRoom: (schedule: ScheduledRoom) => Promise<void>,
  ): Promise<number> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const due = await client.query<Omit<ScheduledRoomRow, "invitee_ids">>(
        `SELECT scheduled_room_id, room_id, owner_id, movie_id, visibility,
                scheduled_for, status, created_at, updated_at
         FROM scheduled_rooms
         WHERE status = 'SCHEDULED' AND scheduled_for <= now()
         ORDER BY scheduled_for, scheduled_room_id
         LIMIT 10 FOR UPDATE SKIP LOCKED`,
      );
      for (const row of due.rows) {
        const invitees = await client.query<{ user_id: string }>(
          `SELECT user_id FROM scheduled_room_invitees
           WHERE scheduled_room_id = $1 ORDER BY user_id`,
          [row.scheduled_room_id],
        );
        const schedule = this.toScheduledRoom({
          ...row,
          invitee_ids: invitees.rows.map((invitee) => invitee.user_id),
        });

        // The row lock makes competing workers skip this schedule. If Redis
        // fails, rollback leaves it SCHEDULED; Redis setup itself is idempotent
        // by the durable room ID, so a commit retry cannot create a second room.
        await openRoom(schedule);

        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        for (const recipientId of schedule.inviteeIds) {
          const invite = await client.query<{ id: string }>(
            `INSERT INTO room_invites
               (id, room_id, inviter_id, recipient_id, role, expires_at)
             VALUES ($1, $2, $3, $4, 'VIEWER', $5)
             ON CONFLICT (room_id, recipient_id)
               WHERE recipient_id IS NOT NULL AND status = 'PENDING'
             DO NOTHING
             RETURNING id`,
            [
              randomUUID(),
              schedule.roomId,
              schedule.ownerId,
              recipientId,
              expiresAt,
            ],
          );
          if (invite.rowCount) {
            const event = {
              eventId: randomUUID(),
              type: "ROOM_INVITED" as const,
              producer: "rooms" as const,
              occurredAt: new Date().toISOString(),
              recipientId,
              payload: {
                roomId: schedule.roomId,
                fromUserId: schedule.ownerId,
              },
            };
            await client.query(
              `INSERT INTO rooms_outbox_events (event_id, type, recipient_id, payload)
               VALUES ($1, 'ROOM_INVITED', $2, $3::jsonb)`,
              [event.eventId, recipientId, JSON.stringify(event)],
            );
          }
        }
        await client.query(
          `UPDATE scheduled_rooms SET status = 'OPENED', updated_at = now()
           WHERE scheduled_room_id = $1 AND status = 'SCHEDULED'`,
          [schedule.scheduledRoomId],
        );
      }
      await client.query("COMMIT");
      return due.rowCount ?? 0;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private selectByIdSql(): string {
    return `SELECT scheduled.scheduled_room_id, scheduled.room_id,
              scheduled.owner_id, scheduled.movie_id, scheduled.visibility,
              scheduled.scheduled_for, scheduled.status,
              scheduled.created_at, scheduled.updated_at,
              COALESCE(array_agg(invitee.user_id) FILTER (WHERE invitee.user_id IS NOT NULL),
                ARRAY[]::uuid[]) AS invitee_ids
            FROM scheduled_rooms AS scheduled
            LEFT JOIN scheduled_room_invitees AS invitee
              ON invitee.scheduled_room_id = scheduled.scheduled_room_id`;
  }

  private toScheduledRoom(row: ScheduledRoomRow): ScheduledRoom {
    return {
      scheduledRoomId: row.scheduled_room_id,
      roomId: row.room_id,
      ownerId: row.owner_id,
      movieId: row.movie_id,
      visibility: row.visibility,
      scheduledFor: row.scheduled_for,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      inviteeIds: row.invitee_ids,
    };
  }
}
