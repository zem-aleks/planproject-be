import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AuthUser } from '../../shared/decorators/auth.decorator';
import { User } from '@supabase/supabase-js';

// TODO: no module
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  findMe(
    @AuthUser()
    user: User,
  ) {
    return { id: user.id, email: user.email };
  }
}
