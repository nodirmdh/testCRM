import { LessonStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  teacherId: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  @MinLength(2)
  topic?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
}
