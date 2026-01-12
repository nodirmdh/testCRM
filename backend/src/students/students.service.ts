import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        organizationId,
        fullName: dto.fullName,
        birthDate: dto.birthDate,
        status: dto.status,
      },
    });
  }

  async findAll(organizationId: string, search?: string, skip = 0, take = 50) {
    return this.prisma.student.findMany({
      where: {
        organizationId,
        ...(search
          ? { fullName: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(organizationId: string, id: string) {
    return this.ensureStudentInOrg(organizationId, id);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateStudentDto,
  ) {
    const updated = await this.prisma.student.updateMany({
      where: { id, organizationId },
      data: {
        fullName: dto.fullName,
        birthDate: dto.birthDate,
        status: dto.status,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Student not found');
    }

    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.prisma.student.deleteMany({
      where: { id, organizationId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Student not found');
    }

    return { id };
  }

  async listActiveGroups(organizationId: string, studentId: string) {
    await this.ensureStudentInOrg(organizationId, studentId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { organizationId, studentId, leftAt: null },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      joinedAt: enrollment.joinedAt,
      group: enrollment.group,
    }));
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
}
