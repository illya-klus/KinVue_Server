import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CallerUserGuard, CallerUserId } from "../common/caller-user";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("users/me")
  @UseGuards(CallerUserGuard)
  me(@CallerUserId() userId: string) {
    return this.users.getMe(userId);
  }

  @Patch("users/me")
  @UseGuards(CallerUserGuard)
  updateMe(@CallerUserId() userId: string, @Body() body: unknown) {
    return this.users.updateMe(userId, body);
  }

  @Get("users/search")
  @UseGuards(CallerUserGuard)
  search(
    @CallerUserId() userId: string,
    @Query("query") query?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.users.search(userId, { query, limit, cursor });
  }

  /** Internal profile bootstrap; never registered on the Gateway. */
  @Post("internal/users/profiles")
  async createProfile(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { profile, created } = await this.users.createProfile(body);
    response.status(created ? 201 : 200);
    return profile;
  }
}
