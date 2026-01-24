import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPeriod, SubscriptionType } from '../../users/types/entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService {
  readonly prices: Record<
    Exclude<SubscriptionType, 'basic'>,
    Record<SubscriptionPeriod, string>
  >;

  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const proMonthly = this.configService.get<string>('PRICES_PRO_MONTHLY');
    const proYearly = this.configService.get<string>('PRICES_PRO_YEARLY');
    const businessMonthly = this.configService.get<string>(
      'PRICES_BUSINESS_MONTHLY',
    );
    const businessYearly = this.configService.get<string>(
      'PRICES_BUSINESS_YEARLY',
    );

    if (!proMonthly || !proYearly || !businessMonthly || !businessYearly) {
      throw new Error('No proper prices');
    }

    this.prices = {
      pro: { monthly: proMonthly, yearly: proYearly },
      business: { monthly: businessMonthly, yearly: businessYearly },
    };
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { stripe } = this.stripeService;
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    let user: User | null = null;

    if (session.client_reference_id) {
      user = await this.usersService.findOne(session.client_reference_id);
    }

    if (!user && session.customer_email) {
      user = await this.usersService.findOneByEmail(session.customer_email);
    }

    if (!user) {
      const error = `Critical subscription error! User not found: ${session.customer_email}, ${session.client_reference_id}, ${subscriptionId}`;
      console.error(error);
      throw new BadRequestException(error);
    }

    const priceId = subscription.items.data[0].price.id;
    const { type, period } = this.getSubscriptionTypeByPriceId(priceId);

    return this.usersService.updatePartial(user.id, {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      subscription: type,
      subscriptionPeriod: period,
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const user = await this.usersService.findOneBySubscriptionId(
      subscription.id,
    );

    if (!user) {
      const error = `Critical subscription UPDATE error! User not found: ${subscription}`;
      console.error(error);
      throw new BadRequestException(error);
    }

    const priceId = subscription.items.data[0].price.id;
    const { type, period } = this.getSubscriptionTypeByPriceId(priceId);
    let newSubscription = user.subscription;
    // by default no changes, only if update provides active subscription and it's not what user had before
    if (user.subscription !== type && subscription.status === 'active') {
      newSubscription = type;
    }

    return this.usersService.updatePartial(user.id, {
      stripePriceId: subscription.items.data[0].price.id,
      subscriptionStatus: subscription.status,
      subscriptionPeriodEnd: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
      subscription: newSubscription,
      subscriptionPeriod: period,
    });
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const user = await this.usersService.findOneBySubscriptionId(
      subscription.id,
    );

    if (!user) {
      const error = `Critical subscription UPDATE error! User not found: ${subscription}`;
      console.error(error);
      throw new BadRequestException(error);
    }

    return this.usersService.updatePartial(user.id, {
      subscriptionStatus: 'canceled',
      subscriptionPeriodEnd: new Date(),
      subscription: 'basic',
    });
  }

  async handlePaymentFailed(invoice: Stripe.Invoice) {
    const user = await this.usersService.findOneByStripeCustomerId(
      invoice.customer as string,
    );

    if (!user) {
      const error = `Critical error! Payment failed and user not found: ${invoice}`;
      throw new BadRequestException(error);
    }
    return this.usersService.updatePartial(user.id, {
      subscriptionStatus: 'past_due',
      subscriptionPeriodEnd: new Date(),
      subscription: 'basic',
    });
  }

  getSubscriptionTypeByPriceId(priceId: string): {
    type: SubscriptionType;
    period: SubscriptionPeriod;
  } {
    switch (priceId) {
      case this.prices.pro.monthly:
        return { type: 'pro', period: 'monthly' };

      case this.prices.pro.yearly:
        return { type: 'pro', period: 'yearly' };

      case this.prices.business.monthly:
        return { type: 'business', period: 'monthly' };

      case this.prices.business.yearly:
        return { type: 'business', period: 'yearly' };

      default:
        return { type: 'basic', period: 'monthly' };
    }
  }

  getPriceId(
    type: SubscriptionType,
    period: SubscriptionPeriod,
  ): string | null {
    if (type === 'basic') {
      return null;
    }

    return this.prices[type][period];
  }
}
