import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  @Get('me') me(@Req() request: AuthenticatedRequest) { return request.user; }
}
