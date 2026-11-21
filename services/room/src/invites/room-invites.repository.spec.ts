import {
  RoomInvitesRepository,
  type RoomInvitedEvent,
} from "./room-invites.repository";
import type { RoomsDatabaseService } from "../database/rooms-database.service";

describe("RoomInvitesRepository outbox", () => {
  const event: RoomInvitedEvent = {
    eventId: "123e4567-e89b-42d3-a456-426614174000",
    type: "ROOM_INVITED",
    producer: "rooms",
    occurredAt: "2026-11-21T20:00:00.000Z",
    recipientId: "123e4567-e89b-42d3-a456-426614174001",
    payload: {
      roomId: "123e4567-e89b-42d3-a456-426614174002",
      fromUserId: "123e4567-e89b-42d3-a456-426614174003",
    },
  };

  function setup() {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes("SELECT event_id, recipient_id, type, payload")) {
          return {
            rows: [
              {
                event_id: event.eventId,
                recipient_id: event.recipientId,
                type: event.type,
                payload: event,
              },
            ],
          };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const database = {
      connect: jest.fn().mockResolvedValue(client),
    };
    return {
      client,
      repository: new RoomInvitesRepository(
        database as unknown as RoomsDatabaseService,
      ),
    };
  }

  it("writes a user invite and its ROOM_INVITED outbox event in one transaction", async () => {
    const statements: Array<{ sql: string; values?: unknown[] }> = [];
    const invite = {
      id: "123e4567-e89b-42d3-a456-426614174004",
      room_id: event.payload.roomId,
      inviter_id: event.payload.fromUserId,
      recipient_id: event.recipientId,
      role: "VIEWER" as const,
      status: "PENDING" as const,
      expires_at: new Date("2026-11-21T21:00:00.000Z"),
    };
    const client = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        statements.push({ sql, values });
        if (sql.includes("SELECT id, room_id, inviter_id, recipient_id")) {
          return { rows: [] };
        }
        if (sql.includes("count(*)::text")) return { rows: [{ count: "0" }] };
        if (sql.includes("INSERT INTO room_invites")) return { rows: [invite] };
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    const database = { connect: jest.fn().mockResolvedValue(client) };
    const repository = new RoomInvitesRepository(
      database as unknown as RoomsDatabaseService,
    );

    const result = await repository.createDirectInvite({
      roomId: event.payload.roomId,
      inviterId: event.payload.fromUserId,
      recipientId: event.recipientId,
      expiresAt: invite.expires_at,
      inviteId: invite.id,
      event,
      availableSlots: 19,
    });

    expect(result).toEqual(invite);
    const outbox = statements.find((entry) =>
      entry.sql.includes("INSERT INTO rooms_outbox_events"),
    );
    expect(outbox?.values?.[0]).toBe(event.eventId);
    expect(outbox?.values?.[1]).toBe(event.recipientId);
    expect(JSON.parse(String(outbox?.values?.[2]))).toEqual(event);
    expect(statements[0]?.sql).toBe("BEGIN");
    expect(statements.at(-1)?.sql).toBe("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  it("marks an event published only after the publisher confirms", async () => {
    const { client, repository } = setup();
    const publish = jest.fn().mockResolvedValue(undefined);

    await repository.publishPending(publish);

    expect(publish).toHaveBeenCalledWith(event);
    const sql = client.query.mock.calls.map(([query]) => query);
    expect(sql.some((query) => query.includes("status = 'PUBLISHED'"))).toBe(
      true,
    );
    expect(sql.at(-1)).toBe("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  it("leaves the event pending and increments retry count when RabbitMQ is unavailable", async () => {
    const { client, repository } = setup();
    const publish = jest.fn().mockRejectedValue(new Error("broker down"));

    await repository.publishPending(publish);

    const sql = client.query.mock.calls.map(([query]) => query);
    expect(
      sql.some((query) => query.includes("retry_count = retry_count + 1")),
    ).toBe(true);
    expect(sql.some((query) => query.includes("status = 'PUBLISHED'"))).toBe(
      false,
    );
    expect(sql.at(-1)).toBe("COMMIT");
  });
});
