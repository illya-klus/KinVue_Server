import { NotificationsRepository } from "./notifications.repository";
import type { DatabaseService } from "./database.service";

describe("NotificationsRepository", () => {
  it("returns duplicate when event already processed", async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ event_id: "e1" }] }),
    } as unknown as DatabaseService;
    const repo = new NotificationsRepository(db);
    const outcome = await repo.insertNotificationIfNewEvent({
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      occurredAt: "2026-11-08T09:00:00.000Z",
      recipientId: "550e8400-e29b-41d4-a716-446655440001",
      type: "FRIEND_REQUEST_CREATED",
      producer: "users",
      payload: {
        friendshipId: "550e8400-e29b-41d4-a716-446655440002",
        fromUserId: "550e8400-e29b-41d4-a716-446655440003",
      },
    });
    expect(outcome).toBe("duplicate");
  });
});
