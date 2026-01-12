import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AccessTokenGuard } from './access-token.guard';
import { RequestWithUser } from '../common/request-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const payload = await this.authService.verifyRefreshToken(dto.refreshToken);
    return this.authService.refresh(payload.sub, dto.refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async me(@Req() request: RequestWithUser) {
    return this.authService.getMe(request.user.id);
  }
}
