import { Injectable } from "@nestjs/common";
import type { NotificationEvent } from "@kinvue/contracts";
import type { NotificationRow } from "./database.service";
import { DatabaseService } from "./database.service";

@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  public async isEventProcessed(eventId: string): Promise<boolean> {
    const result = await this.db.query<{ event_id: string }>(
      `SELECT event_id FROM processed_notification_events WHERE event_id = $1`,
      [eventId],
    );
    return result.rowCount > 0;
  }

  public async insertNotificationIfNewEvent(
    event: NotificationEvent,
  ): Promise<"duplicate" | "created"> {
    const exists = await this.isEventProcessed(event.eventId);
    if (exists) {
      return "duplicate";
    }

    try {
      await this.db.query(
        `INSERT INTO processed_notification_events (event_id) VALUES ($1)`,
        [event.eventId],
      );
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        return "duplicate";
      }
      throw error;
    }

    await this.db.query(
      `INSERT INTO notifications (recipient_id, type, payload)
       VALUES ($1, $2, $3::jsonb)`,
      [event.recipientId, event.type, JSON.stringify(event)],
    );
    return "created";
  }

  public async listForRecipient(
    recipientId: string,
    limit = 50,
  ): Promise<NotificationRow[]> {
    const result = await this.db.query<NotificationRow>(
      `SELECT notification_id, recipient_id, type, payload, read_at, created_at
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [recipientId, limit],
    );
    return result.rows;
  }

  public async markRead(
    recipientId: string,
    notificationId: string,
  ): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE notification_id = $1 AND recipient_id = $2`,
      [notificationId, recipientId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  }
}
