import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { FriendshipsController } from "./friendships.controller";
import { FriendshipsRepository } from "./friendships.repository";
import { FriendshipsService } from "./friendships.service";

@Module({
  imports: [UsersModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService, FriendshipsRepository],
})
export class FriendshipsModule {}
