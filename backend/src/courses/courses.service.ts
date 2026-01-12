import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        durationMonths: dto.durationMonths,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(organizationId: string, search?: string, skip = 0, take = 50) {
    return this.prisma.course.findMany({
      where: {
        organizationId,
        ...(search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(organizationId: string, id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(organizationId: string, id: string, dto: UpdateCourseDto) {
    const updated = await this.prisma.course.updateMany({
      where: { id, organizationId },
      data: {
        name: dto.name,
        description: dto.description,
        durationMonths: dto.durationMonths,
        isActive: dto.isActive,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Course not found');
    }

    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const deleted = await this.prisma.course.deleteMany({
      where: { id, organizationId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Course not found');
    }
    return { id };
  }
}
