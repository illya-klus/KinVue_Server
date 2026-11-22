import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class SearchQueryDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @Length(2, 300)
  q!: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset = 0;
}
