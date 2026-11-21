import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
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
}
