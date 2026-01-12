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

import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RequestWithUser } from '../common/request-user';

@UseGuards(AccessTokenGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(request.user.organizationId, dto);
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
    return this.studentsService.findAll(
      request.user.organizationId,
      search,
      skipNumber,
      takeNumber,
    );
  }

  @Get(':id')
  findOne(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.studentsService.findOne(request.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(request.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.studentsService.remove(request.user.organizationId, id);
  }
}
