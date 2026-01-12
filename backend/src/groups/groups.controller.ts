import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupStatus } from '@prisma/client';

import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { GroupTeacherDto } from './dto/group-teacher.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RequestWithUser } from '../common/request-user';

@UseGuards(AccessTokenGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(request.user.organizationId, dto);
  }

  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('courseId') courseId?: string,
    @Query('status') status?: GroupStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    if (status && !Object.values(GroupStatus).includes(status)) {
      throw new BadRequestException('Invalid group status');
    }
    const skipNumber = skip ? Number(skip) : 0;
    const takeNumber = take ? Number(take) : 50;
    return this.groupsService.findAll(
      request.user.organizationId,
      { courseId, status },
      skipNumber,
      takeNumber,
    );
  }

  @Get(':id')
  findOne(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.groupsService.findOne(request.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(request.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.groupsService.remove(request.user.organizationId, id);
  }

  @Post(':groupId/enroll')
  enroll(
    @Req() request: RequestWithUser,
    @Param('groupId') groupId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.groupsService.enrollStudent(
      request.user.organizationId,
      groupId,
      dto.studentId,
    );
  }

  @Post(':groupId/unenroll')
  unenroll(
    @Req() request: RequestWithUser,
    @Param('groupId') groupId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.groupsService.unenrollStudent(
      request.user.organizationId,
      groupId,
      dto.studentId,
    );
  }

  @Get(':groupId/students')
  listStudents(@Req() request: RequestWithUser, @Param('groupId') groupId: string) {
    return this.groupsService.listGroupStudents(
      request.user.organizationId,
      groupId,
    );
  }

  @Post(':groupId/teachers')
  addTeacher(
    @Req() request: RequestWithUser,
    @Param('groupId') groupId: string,
    @Body() dto: GroupTeacherDto,
  ) {
    return this.groupsService.addTeacherToGroup(
      request.user.organizationId,
      groupId,
      dto.teacherId,
      dto.role,
    );
  }

  @Delete(':groupId/teachers/:teacherId')
  removeTeacher(
    @Req() request: RequestWithUser,
    @Param('groupId') groupId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.groupsService.removeTeacherFromGroup(
      request.user.organizationId,
      groupId,
      teacherId,
    );
  }

  @Get(':groupId/teachers')
  listTeachers(@Req() request: RequestWithUser, @Param('groupId') groupId: string) {
    return this.groupsService.listGroupTeachers(
      request.user.organizationId,
      groupId,
    );
  }
}
