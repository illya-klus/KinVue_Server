import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
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

  /** Not routed by the gateway: service-to-service/dev profile bootstrap. */
  @Post("internal/profiles")
  @HttpCode(200)
  createProfile(@Body() body: unknown) {
    return this.users.createProfile(body);
  }
}
