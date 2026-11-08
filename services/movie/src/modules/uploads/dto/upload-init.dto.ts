import { IsIn, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

const ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
] as const;

export type AllowedUploadContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export class UploadInitDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: AllowedUploadContentType;

  @IsInt()
  @Min(1)
  fileSizeBytes!: number;

  @IsInt()
  @Min(1)
  partCount!: number;
}
