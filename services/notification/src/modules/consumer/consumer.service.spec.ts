import { notificationEventSchema } from "@kinvue/contracts";
import { ConsumerService } from "./consumer.service";

describe("ConsumerService event parsing", () => {
  it("accepts a valid ROOM_INVITED envelope", () => {
    const body = {
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      occurredAt: "2026-11-08T09:00:00.000Z",
      recipientId: "550e8400-e29b-41d4-a716-446655440001",
      type: "ROOM_INVITED",
      producer: "rooms",
      payload: {
        roomId: "550e8400-e29b-41d4-a716-446655440002",
        fromUserId: "550e8400-e29b-41d4-a716-446655440003",
      },
    };
    expect(notificationEventSchema.parse(body).type).toBe("ROOM_INVITED");
  });
});
