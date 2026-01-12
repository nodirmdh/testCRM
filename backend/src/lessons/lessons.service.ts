import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(organizationId: string, dto: CreateLessonDto) {
    const group = await this.ensureGroupInOrg(organizationId, dto.groupId);
    const teacher = await this.ensureTeacherInOrg(organizationId, dto.teacherId);

    const teacherGroup = await this.prisma.teacherGroup.findFirst({
      where: {
        organizationId,
        groupId: group.id,
        teacherId: teacher.id,
      },
    });
    if (!teacherGroup) {
      throw new ConflictException('Teacher is not assigned to this group');
    }

    return this.prisma.lessonSession.create({
      data: {
        organizationId,
        groupId: group.id,
        teacherId: teacher.id,
        date: dto.date,
        topic: dto.topic,
        notes: dto.notes,
        status: dto.status ?? LessonStatus.PLANNED,
      },
    });
  }

  async listLessons(
    organizationId: string,
    groupId?: string,
    skip = 0,
    take = 50,
  ) {
    if (groupId) {
      await this.ensureGroupInOrg(organizationId, groupId);
    }

    return this.prisma.lessonSession.findMany({
      where: {
        organizationId,
        ...(groupId ? { groupId } : {}),
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    });
  }

  async addAttendance(
    organizationId: string,
    lessonId: string,
    dto: CreateAttendanceDto,
  ) {
    if (!dto.items.length) {
      throw new BadRequestException('Attendance list is empty');
    }

    const lesson = await this.ensureLessonInOrg(organizationId, lessonId);
    const studentIds = dto.items.map((item) => item.studentId);
    const uniqueIds = new Set(studentIds);
    if (uniqueIds.size !== studentIds.length) {
      throw new BadRequestException('Duplicate studentId in attendance list');
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
    });
    const studentsById = new Map(students.map((student) => [student.id, student]));
    for (const studentId of studentIds) {
      const student = studentsById.get(studentId);
      if (!student) {
        throw new NotFoundException('Student not found');
      }
      if (student.organizationId !== organizationId) {
        throw new ConflictException('Student belongs to another organization');
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        groupId: lesson.groupId,
        studentId: { in: studentIds },
        leftAt: null,
      },
    });
    const enrolledIds = new Set(enrollments.map((item) => item.studentId));
    for (const studentId of studentIds) {
      if (!enrolledIds.has(studentId)) {
        throw new ConflictException('Student is not enrolled in group');
      }
    }

    const existing = await this.prisma.attendance.findMany({
      where: {
        lessonSessionId: lesson.id,
        studentId: { in: studentIds },
      },
    });
    if (existing.length) {
      throw new ConflictException('Attendance already exists for some students');
    }

    await this.prisma.attendance.createMany({
      data: dto.items.map((item) => ({
        organizationId,
        lessonSessionId: lesson.id,
        studentId: item.studentId,
        status: item.status,
        comment: item.comment,
      })),
    });

    return this.prisma.attendance.findMany({
      where: {
        lessonSessionId: lesson.id,
        studentId: { in: studentIds },
      },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listLessonAttendance(organizationId: string, lessonId: string) {
    await this.ensureLessonInOrg(organizationId, lessonId);

    return this.prisma.attendance.findMany({
      where: { organizationId, lessonSessionId: lessonId },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async ensureGroupInOrg(organizationId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.organizationId !== organizationId) {
      throw new ConflictException('Group belongs to another organization');
    }
    return group;
  }

  private async ensureTeacherInOrg(organizationId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    if (teacher.organizationId !== organizationId) {
      throw new ConflictException('Teacher belongs to another organization');
    }
    return teacher;
  }

  private async ensureLessonInOrg(organizationId: string, lessonId: string) {
    const lesson = await this.prisma.lessonSession.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.organizationId !== organizationId) {
      throw new ConflictException('Lesson belongs to another organization');
    }
    return lesson;
  }
}
