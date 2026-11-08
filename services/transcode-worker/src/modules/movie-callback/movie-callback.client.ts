import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MovieCallbackClient {
  private readonly logger = new Logger(MovieCallbackClient.name);

  constructor(private readonly config: ConfigService) {}

  public async transcodeComplete(
    movieId: string,
    masterKey: string,
  ): Promise<void> {
    const base = this.config.getOrThrow<string>("MOVIE_SERVICE_URL");
    const token = this.config.getOrThrow<string>("MOVIE_INTERNAL_TOKEN");
    const response = await fetch(
      `${base}/internal/movies/${movieId}/transcode-complete`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": token,
        },
        body: JSON.stringify({ masterKey }),
      },
    );
    if (!response.ok) {
      throw new Error(`transcode-complete failed: ${response.status}`);
    }
    this.logger.log(`movie ${movieId} marked READY`);
  }

  public async transcodeFailed(movieId: string): Promise<void> {
    const base = this.config.getOrThrow<string>("MOVIE_SERVICE_URL");
    const token = this.config.getOrThrow<string>("MOVIE_INTERNAL_TOKEN");
    const response = await fetch(
      `${base}/internal/movies/${movieId}/transcode-failed`,
      {
        method: "POST",
        headers: { "x-internal-token": token },
      },
    );
    if (!response.ok) {
      throw new Error(`transcode-failed failed: ${response.status}`);
    }
    this.logger.log(`movie ${movieId} marked PROCESSING_FAILED`);
  }
}
