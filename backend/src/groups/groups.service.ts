import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupStatus, TeacherGroupRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateGroupDto) {
    await this.ensureCourseInOrg(organizationId, dto.courseId);

    return this.prisma.group.create({
      data: {
        organizationId,
        courseId: dto.courseId,
        name: dto.name,
        scheduleText: dto.scheduleText,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status ?? GroupStatus.ACTIVE,
      },
    });
  }

  async findAll(
    organizationId: string,
    filters: { courseId?: string; status?: GroupStatus },
    skip = 0,
    take = 50,
  ) {
    return this.prisma.group.findMany({
      where: {
        organizationId,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(organizationId: string, id: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, organizationId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async update(organizationId: string, id: string, dto: UpdateGroupDto) {
    await this.ensureGroupInOrg(organizationId, id);

    if (dto.courseId) {
      await this.ensureCourseInOrg(organizationId, dto.courseId);
    }

    await this.prisma.group.update({
      where: { id },
      data: {
        courseId: dto.courseId,
        name: dto.name,
        scheduleText: dto.scheduleText,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
      },
    });

    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.prisma.group.deleteMany({
      where: { id, organizationId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Group not found');
    }
    return { id };
  }

  async enrollStudent(organizationId: string, groupId: string, studentId: string) {
    await this.ensureGroupInOrg(organizationId, groupId);
    await this.ensureStudentInOrg(organizationId, studentId);

    const existing = await this.prisma.enrollment.findFirst({
      where: { organizationId, groupId, studentId, leftAt: null },
    });
    if (existing) {
      throw new ConflictException('Student already enrolled in this group');
    }

    return this.prisma.enrollment.create({
      data: {
        organizationId,
        groupId,
        studentId,
      },
    });
  }

  async unenrollStudent(
    organizationId: string,
    groupId: string,
    studentId: string,
  ) {
    await this.ensureGroupInOrg(organizationId, groupId);
    await this.ensureStudentInOrg(organizationId, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { organizationId, groupId, studentId, leftAt: null },
    });
    if (!enrollment) {
      throw new NotFoundException('Active enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { leftAt: new Date() },
    });
  }

  async listGroupStudents(organizationId: string, groupId: string) {
    await this.ensureGroupInOrg(organizationId, groupId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { organizationId, groupId, leftAt: null },
      include: { student: true },
      orderBy: { joinedAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      joinedAt: enrollment.joinedAt,
      student: enrollment.student,
    }));
  }

  async listGroupTeachers(organizationId: string, groupId: string) {
    await this.ensureGroupInOrg(organizationId, groupId);

    const teacherGroups = await this.prisma.teacherGroup.findMany({
      where: { organizationId, groupId },
      include: { teacher: true },
      orderBy: { createdAt: 'desc' },
    });

    return teacherGroups.map((entry) => ({
      role: entry.role,
      teacher: entry.teacher,
    }));
  }

  async addTeacherToGroup(
    organizationId: string,
    groupId: string,
    teacherId: string,
    role?: TeacherGroupRole,
  ) {
    await this.ensureGroupInOrg(organizationId, groupId);
    await this.ensureTeacherInOrg(organizationId, teacherId);

    const existing = await this.prisma.teacherGroup.findFirst({
      where: { organizationId, groupId, teacherId },
    });
    if (existing) {
      throw new ConflictException('Teacher already assigned to this group');
    }

    return this.prisma.teacherGroup.create({
      data: {
        organizationId,
        groupId,
        teacherId,
        role: role ?? TeacherGroupRole.LEAD,
      },
    });
  }

  async removeTeacherFromGroup(
    organizationId: string,
    groupId: string,
    teacherId: string,
  ) {
    const deleted = await this.prisma.teacherGroup.deleteMany({
      where: { organizationId, groupId, teacherId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Teacher assignment not found');
    }
    return { teacherId, groupId };
  }

  private async ensureCourseInOrg(organizationId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.organizationId !== organizationId) {
      throw new ConflictException('Course belongs to another organization');
    }
    return course;
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

  private async ensureStudentInOrg(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.organizationId !== organizationId) {
      throw new ConflictException('Student belongs to another organization');
    }
    return student;
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
}
