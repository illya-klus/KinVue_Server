import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class UploadCompletePartDto {
  @IsInt()
  @Min(1)
  partNumber!: number;

  @IsString()
  @IsNotEmpty()
  etag!: string;
}

export class UploadCompleteDto {
  @IsUUID()
  uploadId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UploadCompletePartDto)
  parts!: UploadCompletePartDto[];
}
