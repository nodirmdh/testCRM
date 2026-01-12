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

import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RequestWithUser } from '../common/request-user';

@UseGuards(AccessTokenGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateTeacherDto) {
    return this.teachersService.create(request.user.organizationId, dto);
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
    return this.teachersService.findAll(
      request.user.organizationId,
      search,
      skipNumber,
      takeNumber,
    );
  }

  @Get(':id')
  findOne(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.teachersService.findOne(request.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(request.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.teachersService.remove(request.user.organizationId, id);
  }
}
