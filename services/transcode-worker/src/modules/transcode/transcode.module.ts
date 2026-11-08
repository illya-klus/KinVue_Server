import { Module } from "@nestjs/common";
import { HlsTranscodeService } from "./hls-transcode.service";

@Module({
  providers: [HlsTranscodeService],
  exports: [HlsTranscodeService],
})
export class TranscodeModule {}
