import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RequestWithUser } from '../common/request-user';

@UseGuards(AccessTokenGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateLessonDto) {
    return this.lessonsService.createLesson(request.user.organizationId, dto);
  }

  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('groupId') groupId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? Number(skip) : 0;
    const takeNumber = take ? Number(take) : 50;
    return this.lessonsService.listLessons(
      request.user.organizationId,
      groupId,
      skipNumber,
      takeNumber,
    );
  }

  @Post(':lessonId/attendance')
  addAttendance(
    @Req() request: RequestWithUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.lessonsService.addAttendance(
      request.user.organizationId,
      lessonId,
      dto,
    );
  }

  @Get(':lessonId/attendance')
  listAttendance(
    @Req() request: RequestWithUser,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lessonsService.listLessonAttendance(
      request.user.organizationId,
      lessonId,
    );
  }
}
