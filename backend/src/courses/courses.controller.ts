import {
  Body,
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

import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RequestWithUser } from '../common/request-user';

@UseGuards(AccessTokenGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(request.user.organizationId, dto);
  }

  @Get()
  findAll(
    @Req() request: RequestWithUser,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? Number(skip) : 0;
    const takeNumber = take ? Number(take) : 50;
    return this.coursesService.findAll(
      request.user.organizationId,
      search,
      skipNumber,
      takeNumber,
    );
  }

  @Get(':id')
  findOne(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.coursesService.findOne(request.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(request.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.coursesService.remove(request.user.organizationId, id);
  }
}
