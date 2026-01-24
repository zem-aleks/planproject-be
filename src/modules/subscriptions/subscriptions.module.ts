import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from './services/subscriptions.service';
import { UsersModule } from '../users/users.module';
import { StripeService } from './services/stripe.service';
import { PlansModule } from '../plans/plans.module';
import { MembershipService } from './services/membership.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [UsersModule, forwardRef(() => PlansModule)],
  providers: [SubscriptionsService, StripeService, MembershipService],
  exports: [SubscriptionsService, StripeService, MembershipService],
  controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
