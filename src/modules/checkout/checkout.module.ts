import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutController } from './checkout.controller';
import { SubscriptionsService } from './subscriptions.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [StripeService, SubscriptionsService],
  exports: [StripeService],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
