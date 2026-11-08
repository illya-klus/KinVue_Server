import { Global, Module } from "@nestjs/common";
import { NotificationsTopologyService } from "./notifications-topology.service";

@Global()
@Module({
  providers: [NotificationsTopologyService],
  exports: [NotificationsTopologyService],
})
export class MessagingModule {}
