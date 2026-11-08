import { Module } from "@nestjs/common";
import { InternalMoviesController } from "./internal-movies.controller";

@Module({
  controllers: [InternalMoviesController],
})
export class InternalModule {}
