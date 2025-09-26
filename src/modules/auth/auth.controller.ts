import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser } from '../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  @Get('me')
  findMe(@AuthUser() user: User) {
    return { id: user.id, email: user.email };
  }
}
