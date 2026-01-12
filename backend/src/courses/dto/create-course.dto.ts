import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
