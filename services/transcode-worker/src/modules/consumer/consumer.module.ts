import { Module } from "@nestjs/common";
import { MovieCallbackModule } from "../movie-callback/movie-callback.module";
import { TranscodeModule } from "../transcode/transcode.module";
import { ConsumerService } from "./consumer.service";

@Module({
  imports: [TranscodeModule, MovieCallbackModule],
  providers: [ConsumerService],
})
export class ConsumerModule {}
