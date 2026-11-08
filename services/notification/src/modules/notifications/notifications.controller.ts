import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CallerUserGuard } from "../../common/guards/caller-user.guard";
import { NotificationsRepository } from "../../database/notifications.repository";

type AuthedRequest = Request & { callerUserId: string };

@Controller("notifications")
@UseGuards(CallerUserGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsRepository) {}

  @Get()
  public async list(@Req() request: AuthedRequest) {
    const rows = await this.notifications.listForRecipient(
      request.callerUserId,
    );
    return {
      items: rows.map((row) => ({
        id: row.notification_id,
        type: row.type,
        payload: row.payload,
        readAt: row.read_at,
        createdAt: row.created_at,
      })),
    };
  }

  @Post(":notificationId/read")
  public async markRead(
    @Req() request: AuthedRequest,
    @Param("notificationId") notificationId: string,
  ) {
    const updated = await this.notifications.markRead(
      request.callerUserId,
      notificationId,
    );
    if (!updated) {
      throw new NotFoundException("Notification not found");
    }
    return { ok: true };
  }
}
