import { GroupStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsUUID()
  courseId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  scheduleText: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
