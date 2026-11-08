import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { FriendshipsController } from "./friendships.controller";
import { FriendshipsRepository } from "./friendships.repository";
import { FriendshipsService } from "./friendships.service";
import { SharedLogger } from "../shared-logger";

@Module({
  imports: [UsersModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService, FriendshipsRepository, SharedLogger],
})
export class FriendshipsModule {}
