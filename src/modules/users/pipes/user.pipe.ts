import {
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { AuthRequest } from '../../auth/types';

@Injectable()
export class UserPipe implements PipeTransform<AuthRequest, Promise<User>> {
  constructor(private readonly usersService: UsersService) {}

  async transform(request: AuthRequest) {
    if (!request.user.email) {
      throw new UnauthorizedException({
        cause: 'invalid_Auth_request',
        description: 'User email is missing in the request',
      });
    }

    const user = await this.usersService.findOneByEmail(request.user.email);
    if (!user) {
      return this.usersService.create({
        email: request.user.email,
        id: request.user.id,
        subscription: 'business', // TODO: for now all users will be business
      });
    }

    return user;
  }
}
