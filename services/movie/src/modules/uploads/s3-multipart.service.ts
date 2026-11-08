import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
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
        this.s3,
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
    await this.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: objectKey,
        UploadId: s3UploadId,
        MultipartUpload: { Parts: completed },
      }),
    );
  }
}
