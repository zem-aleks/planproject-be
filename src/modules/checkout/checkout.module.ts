import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [UsersModule, SubscriptionsModule],
  providers: [],
  exports: [],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
