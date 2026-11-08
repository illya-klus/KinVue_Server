import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import type { MediaTranscodeJob } from "../../messaging/media-transcode-job.schema";

@Injectable()
export class HlsTranscodeService {
  private readonly logger = new Logger(HlsTranscodeService.name);
  private readonly s3: S3Client;

  constructor(private readonly config: ConfigService) {
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

  public async transcode(job: MediaTranscodeJob): Promise<string> {
    const workDir = await mkdtemp(join(tmpdir(), "kinvue-transcode-"));
    const localInput = join(workDir, "source.mp4");
    const outputDir = join(workDir, "hls");

    try {
      await mkdir(outputDir, { recursive: true });
      await this.downloadObject(job.originalKey, localInput);
      await this.runFfmpeg(localInput, outputDir);
      const masterKey = `movies/${job.movieId}/hls/master.m3u8`;
      await this.uploadDirectory(outputDir, `movies/${job.movieId}/hls`);
      return masterKey;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async downloadObject(key: string, target: string): Promise<void> {
    const bucket = this.config.getOrThrow<string>("S3_BUCKET");
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error(`missing object body for ${key}`);
    }
    await pipeline(
      response.Body as NodeJS.ReadableStream,
      createWriteStream(target),
    );
  }

  private runFfmpeg(input: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        "-y",
        "-i",
        input,
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];" +
          "[v1]scale=w=1920:h=-2[v1out];" +
          "[v2]scale=w=1280:h=-2[v2out];" +
          "[v3]scale=w=854:h=-2[v3out]",
        "-map",
        "[v1out]",
        "-map",
        "0:a?",
        "-map",
        "[v2out]",
        "-map",
        "0:a?",
        "-map",
        "[v3out]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-b:v:0",
        "5000k",
        "-b:v:1",
        "2800k",
        "-b:v:2",
        "1400k",
        "-var_stream_map",
        "v:0,a:0 v:1,a:1 v:2,a:2",
        "-master_pl_name",
        "master.m3u8",
        "-f",
        "hls",
        "-hls_time",
        "4",
        "-hls_playlist_type",
        "vod",
        join(outputDir, "stream_%v.m3u8"),
      ];
      const child = spawn("ffmpeg", args, { stdio: "pipe" });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
  }

  private async uploadDirectory(localDir: string, prefix: string): Promise<void> {
    const bucket = this.config.getOrThrow<string>("S3_BUCKET");
    const names = await readdir(localDir);
    for (const name of names) {
      const key = `${prefix}/${name}`.replace(/\/{2,}/g, "/");
      const filePath = join(localDir, name);
      const body = await readFile(filePath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: this.contentType(key),
        }),
      );
    }
    this.logger.log(`uploaded HLS ladder to ${prefix}`);
  }

  private contentType(key: string): string {
    if (key.endsWith(".m3u8")) {
      return "application/vnd.apple.mpegurl";
    }
    if (key.endsWith(".ts")) {
      return "video/mp2t";
    }
    return "application/octet-stream";
  }
}
