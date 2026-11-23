import { ConfigService } from "@nestjs/config";
import { Injectable, NotFoundException } from "@nestjs/common";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MoviesRepository } from "../../database/movies.repository";

const MEDIA_ACCESS_TTL_SECONDS = 600;

@Injectable()
export class MediaAccessService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    private readonly movies: MoviesRepository,
  ) {
    this.bucket = this.config.getOrThrow<string>("S3_BUCKET");
    this.s3 = new S3Client({
      endpoint: this.config.getOrThrow<string>("S3_ENDPOINT"),
      region: "us-east-1",
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("S3_ACCESS_KEY"),
        secretAccessKey: this.config.getOrThrow<string>("S3_SECRET_KEY"),
      },
      forcePathStyle: true,
    });
  }

  async createAccess(movieId: string) {
    const movie = await this.movies.findById(movieId);
    if (
      !movie ||
      movie.status !== "PUBLISHED" ||
      movie.media_status !== "READY" ||
      !movie.hls_master_key
    ) {
      throw new NotFoundException("Playable movie not found");
    }

    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: movie.hls_master_key }),
      { expiresIn: MEDIA_ACCESS_TTL_SECONDS },
    );
    return {
      url,
      expiresAt: new Date(
        Date.now() + MEDIA_ACCESS_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  }
}
