import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CallerUserGuard, CallerUserId } from "../common/caller-user";
import { FriendshipsService } from "./friendships.service";

@Controller()
@UseGuards(CallerUserGuard)
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Post("friend-requests")
  send(@CallerUserId() userId: string, @Body() body: unknown) {
    return this.friendships.sendRequest(userId, body);
  }

  @Get("friend-requests/incoming")
  incoming(@CallerUserId() userId: string) {
    return this.friendships.incoming(userId);
  }

  @Get("friend-requests/outgoing")
  outgoing(@CallerUserId() userId: string) {
    return this.friendships.outgoing(userId);
  }

  @Post("friend-requests/:id/accept")
  @HttpCode(200)
  accept(@CallerUserId() userId: string, @Param("id") id: string) {
    return this.friendships.accept(userId, id);
  }

  @Post("friend-requests/:id/reject")
  @HttpCode(200)
  reject(@CallerUserId() userId: string, @Param("id") id: string) {
    return this.friendships.reject(userId, id);
  }

  @Get("friends")
  friends(@CallerUserId() userId: string) {
    return this.friendships.friends(userId);
  }
}
