import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { posix } from "node:path";
import { MoviesRepository } from "../../database/movies.repository";

// S3 local delivery adapter. Only small control manifests enter this process;
// all playlist and segment HTTP responses are served directly by private storage.
@Injectable()
export class MediaAccessService {
  private readonly storage: S3Client;
  private readonly signer: S3Client;
  private readonly bucket: string;
  constructor(
    config: ConfigService,
    private readonly movies: MoviesRepository,
  ) {
    const options = {
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>("S3_ACCESS_KEY"),
        secretAccessKey: config.getOrThrow<string>("S3_SECRET_KEY"),
      },
    };
    this.storage = new S3Client({
      ...options,
      endpoint: config.getOrThrow<string>("S3_ENDPOINT"),
    });
    this.signer = new S3Client({
      ...options,
      endpoint:
        config.get<string>("S3_PUBLIC_ENDPOINT") ??
        config.getOrThrow<string>("S3_ENDPOINT"),
    });
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
  }

  async createAccess(movieId: string) {
    const movie = await this.movies.findById(movieId);
    if (
      !movie ||
      movie.status !== "PUBLISHED" ||
      movie.media_status !== "READY" ||
      !movie.hls_master_key
    )
      throw new NotFoundException("Playable movie not found");
    const prefix = `movies/${movieId}/hls/`;
    if (
      !movie.hls_master_key.startsWith(prefix) ||
      posix.normalize(movie.hls_master_key) !== movie.hls_master_key ||
      !movie.hls_master_key.endsWith(".m3u8")
    )
      throw new NotFoundException("Playable movie not found");
    const signingDate = new Date();
    const session = `_access/${randomUUID()}/`;
    const seen = new Set<string>();
    let references = 0;
    const sign = (key: string) =>
      getSignedUrl(
        this.signer,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: 600, signingDate },
      );
    const resolve = async (parent: string, uri: string): Promise<string> => {
      if (
        ++references > 20_000 ||
        /[?#:\\]/.test(uri) ||
        [...uri].some((char) => char.charCodeAt(0) <= 32) ||
        uri.startsWith("/")
      )
        throw new Error("Unsupported HLS reference");
      const key = posix.normalize(posix.join(posix.dirname(parent), uri));
      if (!key.startsWith(prefix))
        throw new Error("HLS reference outside movie");
      return key.endsWith(".m3u8") ? manifest(key) : sign(key);
    };
    const manifest = async (key: string): Promise<string> => {
      if (seen.has(key) || seen.size >= 32)
        throw new Error("Invalid HLS playlist graph");
      seen.add(key);
      const object = await this.storage.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (
        !object.Body ||
        !object.ContentLength ||
        object.ContentLength > 2_000_000
      )
        throw new Error("Invalid HLS manifest size");
      const text = await object.Body.transformToString();
      if (!text.startsWith("#EXTM3U")) throw new Error("Invalid HLS manifest");
      const lines: string[] = [];
      for (const line of text.split(/\r?\n/)) {
        if (line.trim() && !line.startsWith("#"))
          lines.push(await resolve(key, line.trim()));
        else {
          let rewritten = line;
          for (const match of line.matchAll(/URI="([^"]+)"/g))
            rewritten = rewritten.replace(
              match[0],
              `URI="${await resolve(key, match[1]!)}"`,
            );
          lines.push(rewritten);
        }
      }
      const target = session + key.slice(prefix.length);
      await this.storage.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: target,
          Body: lines.join("\n"),
          ContentType: "application/vnd.apple.mpegurl",
          CacheControl: "private, no-store",
        }),
      );
      return sign(target);
    };
    return {
      url: await manifest(movie.hls_master_key),
      expiresAt: new Date(signingDate.getTime() + 600_000).toISOString(),
    };
  }
}
