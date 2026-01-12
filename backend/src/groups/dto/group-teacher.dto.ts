import { TeacherGroupRole } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GroupTeacherDto {
  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsEnum(TeacherGroupRole)
  role?: TeacherGroupRole;
}
