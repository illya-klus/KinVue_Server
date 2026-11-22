import { ConflictException, Injectable } from "@nestjs/common";
import { RoomsDatabaseService } from "../database/rooms-database.service";

export type RoomInviteRole = "VIEWER" | "CONTROLLER";
export type DirectInviteRow = {
  id: string;
  room_id: string;
  inviter_id: string;
  recipient_id: string;
  role: RoomInviteRole;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expires_at: Date;
};
export type LinkInviteRow = Pick<
  DirectInviteRow,
  "id" | "room_id" | "inviter_id" | "role" | "expires_at"
>;
export type RoomInvitedEvent = {
  eventId: string;
  type: "ROOM_INVITED";
  producer: "rooms";
  occurredAt: string;
  recipientId: string;
  payload: { roomId: string; fromUserId: string };
};

@Injectable()
export class RoomInvitesRepository {
  constructor(private readonly database: RoomsDatabaseService) {}

  async createDirectInvite(input: {
    roomId: string;
    inviterId: string;
    recipientId: string;
    expiresAt: Date;
    inviteId: string;
    event: RoomInvitedEvent;
    availableSlots: number;
  }): Promise<DirectInviteRow> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [input.roomId],
      );
      await client.query(
        `UPDATE room_invites SET status = 'EXPIRED'
         WHERE room_id = $1 AND status = 'PENDING' AND expires_at <= now()`,
        [input.roomId],
      );
      const existing = await client.query<DirectInviteRow>(
        `SELECT id, room_id, inviter_id, recipient_id, role, status, expires_at
         FROM room_invites
         WHERE room_id = $1 AND recipient_id = $2 AND status = 'PENDING' AND expires_at > now()
         LIMIT 1`,
        [input.roomId, input.recipientId],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return existing.rows[0];
      }
      const pending = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM room_invites
         WHERE room_id = $1 AND recipient_id IS NOT NULL
           AND status = 'PENDING' AND expires_at > now()`,
        [input.roomId],
      );
      if (Number(pending.rows[0]?.count ?? 0) >= input.availableSlots) {
        throw new ConflictException(
          "Room capacity is reserved by pending invites",
        );
      }
      const result = await client.query<DirectInviteRow>(
        `INSERT INTO room_invites
           (id, room_id, inviter_id, recipient_id, role, expires_at)
         VALUES ($1, $2, $3, $4, 'VIEWER', $5)
         RETURNING id, room_id, inviter_id, recipient_id, role, status, expires_at`,
        [
          input.inviteId,
          input.roomId,
          input.inviterId,
          input.recipientId,
          input.expiresAt,
        ],
      );
      await client.query(
        `INSERT INTO rooms_outbox_events (event_id, type, recipient_id, payload, created_at)
         VALUES ($1, 'ROOM_INVITED', $2, $3::jsonb, $4)`,
        [
          input.event.eventId,
          input.event.recipientId,
          JSON.stringify(input.event),
          input.event.occurredAt,
        ],
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async createLinkInvite(input: {
    roomId: string;
    inviterId: string;
    tokenHash: Buffer;
    expiresAt: Date;
    inviteId: string;
  }): Promise<LinkInviteRow> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [input.roomId],
      );
      await client.query(
        `UPDATE room_invites SET status = 'REVOKED'
         WHERE room_id = $1 AND recipient_id IS NULL AND status = 'PENDING'`,
        [input.roomId],
      );
      const result = await client.query<LinkInviteRow>(
        `INSERT INTO room_invites (id, room_id, inviter_id, token_hash, role, expires_at)
         VALUES ($1, $2, $3, $4, 'VIEWER', $5)
         RETURNING id, room_id, inviter_id, role, expires_at`,
        [
          input.inviteId,
          input.roomId,
          input.inviterId,
          input.tokenHash,
          input.expiresAt,
        ],
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async findLinkInvite(
    roomId: string,
    tokenHash: Buffer,
  ): Promise<LinkInviteRow | null> {
    const result = await this.database.query<LinkInviteRow>(
      `SELECT id, room_id, inviter_id, role, expires_at
       FROM room_invites
       WHERE room_id = $1 AND token_hash = $2 AND status = 'PENDING' AND expires_at > now()
       LIMIT 1`,
      [roomId, tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async findDirectInvite(
    roomId: string,
    recipientId: string,
  ): Promise<DirectInviteRow | null> {
    const result = await this.database.query<DirectInviteRow>(
      `SELECT id, room_id, inviter_id, recipient_id, role, status, expires_at
       FROM room_invites
       WHERE room_id = $1 AND recipient_id = $2 AND status = 'PENDING' AND expires_at > now()
       LIMIT 1`,
      [roomId, recipientId],
    );
    return result.rows[0] ?? null;
  }

  async markAccepted(inviteId: string) {
    await this.database.query(
      `UPDATE room_invites SET status = 'ACCEPTED', accepted_at = now()
       WHERE id = $1 AND status = 'PENDING'`,
      [inviteId],
    );
  }

  async countPendingDirectInvites(roomId: string): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM room_invites
       WHERE room_id = $1 AND recipient_id IS NOT NULL
         AND status = 'PENDING' AND expires_at > now()`,
      [roomId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async revokeForRoom(roomId: string) {
    await this.database.query(
      `UPDATE room_invites SET status = 'REVOKED'
       WHERE room_id = $1 AND status = 'PENDING'`,
      [roomId],
    );
  }

  async publishPending(publish: (event: RoomInvitedEvent) => Promise<void>) {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const pending = await client.query<{
        event_id: string;
        recipient_id: string;
        type: "ROOM_INVITED";
        payload: RoomInvitedEvent;
      }>(
        `SELECT event_id, recipient_id, type, payload
         FROM rooms_outbox_events WHERE status = 'PENDING'
         ORDER BY created_at, event_id LIMIT 25 FOR UPDATE SKIP LOCKED`,
      );
      for (const row of pending.rows) {
        try {
          await publish(row.payload);
          await client.query(
            `UPDATE rooms_outbox_events SET status = 'PUBLISHED', published_at = now()
             WHERE event_id = $1 AND status = 'PENDING'`,
            [row.event_id],
          );
        } catch {
          await client.query(
            `UPDATE rooms_outbox_events SET retry_count = retry_count + 1 WHERE event_id = $1`,
            [row.event_id],
          );
          break;
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
