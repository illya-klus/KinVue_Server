import { Global, Module } from "@nestjs/common";
import { MediaTranscodeTopologyService } from "./media-transcode-topology.service";

@Global()
@Module({
  providers: [MediaTranscodeTopologyService],
  exports: [MediaTranscodeTopologyService],
})
export class MessagingModule {}
