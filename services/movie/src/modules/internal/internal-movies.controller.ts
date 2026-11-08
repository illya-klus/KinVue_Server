import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MoviesRepository } from "../../database/movies.repository";

type TranscodeCompleteDto = {
  masterKey: string;
};

@Controller("internal/movies")
export class InternalMoviesController {
  constructor(
    private readonly movies: MoviesRepository,
    private readonly config: ConfigService,
  ) {}

  @Post(":movieId/transcode-complete")
  public async transcodeComplete(
    @Headers("x-internal-token") token: string | undefined,
    @Param("movieId") movieId: string,
    @Body() body: TranscodeCompleteDto,
  ) {
    this.assertInternal(token);
    const masterKey = body.masterKey?.trim();
    if (!masterKey) {
      throw new ForbiddenException("masterKey is required");
    }

    const updated = await this.movies.markMediaReady(movieId, masterKey);
    if (!updated) {
      throw new NotFoundException("Movie not found");
    }
    return { ok: true, mediaStatus: "READY" };
  }

  @Post(":movieId/transcode-failed")
  public async transcodeFailed(
    @Headers("x-internal-token") token: string | undefined,
    @Param("movieId") movieId: string,
  ) {
    this.assertInternal(token);
    const updated = await this.movies.markMediaFailed(movieId);
    if (!updated) {
      throw new NotFoundException("Movie not found");
    }
    return { ok: true, mediaStatus: "PROCESSING_FAILED" };
  }

  private assertInternal(token: string | undefined): void {
    const expected = this.config.get<string>("MOVIE_INTERNAL_TOKEN");
    if (!expected || token !== expected) {
      throw new ForbiddenException("Internal endpoint");
    }
  }
}
