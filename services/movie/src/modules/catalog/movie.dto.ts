import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateMovieDto {
  @Transform(trim) @IsString() @Length(1, 300) title!: string;
  @Transform(trim) @IsString() @Length(1, 20000) description!: string;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Length(1, 100, { each: true })
  genres!: string[];
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  durationSeconds?: number;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2048)
  posterKey?: string;
}
export class UpdateMovieDto {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @Length(1, 300)
  title?: string;
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @Length(1, 20000)
  description?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Length(1, 100, { each: true })
  genres?: string[];
  @IsOptional() @IsInt() @Min(1) durationSeconds?: number | null;
  @IsOptional() @IsString() @MaxLength(2048) posterKey?: string | null;
}
export class ScheduleMovieDto {
  @IsDateString({ strict: true }) publishAt!: string;
}
