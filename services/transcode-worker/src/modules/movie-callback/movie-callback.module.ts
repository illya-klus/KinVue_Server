import { Module } from "@nestjs/common";
import { MovieCallbackClient } from "./movie-callback.client";

@Module({
  providers: [MovieCallbackClient],
  exports: [MovieCallbackClient],
})
export class MovieCallbackModule {}
