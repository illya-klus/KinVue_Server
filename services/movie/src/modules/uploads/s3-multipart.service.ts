import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AbortMultipartUploadCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PRESIGN_TTL_SECONDS = 3600;

@Injectable()
export class S3MultipartService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly signer: S3Client;

  constructor(private readonly config: ConfigService) {
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
    this.signer = new S3Client({
      endpoint:
        this.config.get<string>("S3_PUBLIC_ENDPOINT") ??
        this.config.getOrThrow<string>("S3_ENDPOINT"),
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("S3_ACCESS_KEY"),
        secretAccessKey: this.config.getOrThrow<string>("S3_SECRET_KEY"),
      },
    });
  }

  public async createMultipartUpload(
    objectKey: string,
    contentType: string,
  ): Promise<string> {
    const response = await this.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: contentType,
      }),
    );
    const uploadId = response.UploadId?.trim();
    if (!uploadId) {
      throw new Error("S3 did not return a multipart upload id");
    }
    return uploadId;
  }

  public async presignUploadParts(
    objectKey: string,
    s3UploadId: string,
    partCount: number,
  ): Promise<{ partNumber: number; url: string }[]> {
    const parts: { partNumber: number; url: string }[] = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
      const url = await getSignedUrl(
        this.signer,
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: objectKey,
          UploadId: s3UploadId,
          PartNumber: partNumber,
        }),
        { expiresIn: PRESIGN_TTL_SECONDS },
      );
      parts.push({ partNumber, url });
    }
    return parts;
  }

  public async completeMultipartUpload(
    objectKey: string,
    s3UploadId: string,
    parts: { partNumber: number; etag: string }[],
  ): Promise<void> {
    const completed: CompletedPart[] = parts
      .slice()
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => ({
        PartNumber: part.partNumber,
        ETag: part.etag,
      }));
    try {
      await this.s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: objectKey,
          UploadId: s3UploadId,
          MultipartUpload: { Parts: completed },
        }),
      );
    } catch (error) {
      if ((error as { name?: string }).name !== "NoSuchUpload") throw error;
      // A previous complete may have succeeded before the database transaction failed.
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
    }
  }
  async abortMultipartUpload(
    objectKey: string,
    uploadId: string,
  ): Promise<void> {
    try {
      await this.s3.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: objectKey,
          UploadId: uploadId,
        }),
      );
    } catch (error) {
      if ((error as { name?: string }).name !== "NoSuchUpload") throw error;
    }
  }

  async cleanOrphanedMultipart(): Promise<void> {
    let keyMarker: string | undefined, uploadMarker: string | undefined;
    do {
      const page = await this.s3.send(
        new ListMultipartUploadsCommand({
          Bucket: this.bucket,
          Prefix: "movies/",
          KeyMarker: keyMarker,
          UploadIdMarker: uploadMarker,
        }),
      );
      for (const upload of page.Uploads ?? []) {
        if (
          upload.Key &&
          upload.UploadId &&
          upload.Initiated &&
          Date.now() - upload.Initiated.getTime() > 86_400_000
        )
          await this.abortMultipartUpload(upload.Key, upload.UploadId);
      }
      keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
      uploadMarker = page.NextUploadIdMarker;
    } while (keyMarker);
  }
}
