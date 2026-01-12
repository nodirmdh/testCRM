import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: {
        organizationId,
        fullName: dto.fullName,
        phone: dto.phone,
        specialization: dto.specialization,
        isActive: dto.isActive ?? true,
        note: dto.note,
      },
    });
  }

  async findAll(organizationId: string, search?: string, skip = 0, take = 50) {
    return this.prisma.teacher.findMany({
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
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, organizationId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  async update(organizationId: string, id: string, dto: UpdateTeacherDto) {
    const updated = await this.prisma.teacher.updateMany({
      where: { id, organizationId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        specialization: dto.specialization,
        isActive: dto.isActive,
        note: dto.note,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Teacher not found');
    }

    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.prisma.teacher.deleteMany({
      where: { id, organizationId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Teacher not found');
    }
    return { id };
  }
}
