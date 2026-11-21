import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  BadRequestException,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service";

@Controller()
export class AppController {
  constructor(private readonly rooms: RoomsService) {}

  @Post("rooms")
  createRoom(
    @Body() body: { movieId?: unknown; visibility?: unknown },
    @Headers("x-user-id") userId?: string,
  ) {
    return this.rooms.createRoom(body?.movieId, body?.visibility, userId);
  }

  @Get("rooms/public")
  async listPublicRooms() {
    return { items: await this.rooms.listPublicRooms() };
  }

  @Delete("rooms/:id")
  async closeRoom(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
  ) {
    await this.rooms.closeRoom(id, userId);
    return { status: "CLOSED", id };
  }

  @Post("rooms/:id/invites")
  createDirectInvite(
    @Param("id") id: string,
    @Body() body: { targetUserId?: unknown; role?: unknown },
    @Headers("x-user-id") userId?: string,
  ) {
    if (body?.role !== undefined && body.role !== "VIEWER") {
      throw new BadRequestException("Invited users start as VIEWER");
    }
    return this.rooms.createDirectInvite(id, body?.targetUserId, userId);
  }

  @Post("rooms/:id/invites/link")
  createInviteLink(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
  ) {
    return this.rooms.createInviteLink(id, userId);
  }

  @Post("rooms/:id/invites/accept")
  acceptInvite(
    @Param("id") id: string,
    @Body() body: { token?: unknown },
    @Headers("x-user-id") userId?: string,
  ) {
    return this.rooms.acceptInvite(id, body?.token, userId);
  }

  @Post("rooms/:id/permissions")
  changeMemberRole(
    @Param("id") id: string,
    @Body() body: { userId?: unknown; role?: unknown },
    @Headers("x-user-id") ownerId?: string,
  ) {
    return this.rooms.changeMemberRole(id, body?.userId, body?.role, ownerId);
  }
}
