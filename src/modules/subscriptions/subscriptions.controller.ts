import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../users/entities/user.entity';
import { CustomRequest } from '../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../users/pipes/user.pipe';
import { SubscriptionEntity } from './types/entity';
import { MembershipService } from './services/membership.service';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  async getSubscription(
    @CustomRequest(UserPipe)
    user: User,
  ): Promise<SubscriptionEntity> {
    return this.membershipService.getMembershipDetails(user);
  }
}
