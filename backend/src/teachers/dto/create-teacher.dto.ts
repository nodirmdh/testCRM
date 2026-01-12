import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(3)
  phone: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
