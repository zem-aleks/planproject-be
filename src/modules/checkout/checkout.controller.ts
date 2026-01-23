import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from './subscriptions.service';
import { User } from '../users/entities/user.entity';
import { CustomRequest } from '../../shared/decorators/custom-request.decorator';
import { UserPipe } from '../users/pipes/user.pipe';
import { SubscriptionPeriod, SubscriptionType } from '../users/types/entity';

@Controller('checkout')
export class CheckoutController {
  feUrl: string;

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const feUrl = this.configService.get<string>('FRONTEND_URL') as string;
    if (!feUrl) {
      throw new Error('No FE config');
    }
    this.feUrl = feUrl;
  }

  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(
    @CustomRequest(UserPipe)
    user: User,
  ) {
    const { stripe } = this.stripeService;
    if (!user.stripeCustomerId) {
      throw new BadRequestException('No Stripe Customer Data');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.feUrl}/account`,
    });

    return { url: session.url };
  }

  @Post('create-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Body()
    { type, period }: { type: SubscriptionType; period: SubscriptionPeriod },
    @CustomRequest(UserPipe)
    user: User,
  ) {
    const { stripe } = this.stripeService;
    const priceId = this.subscriptionsService.getPriceId(type, period);
    if (!priceId) {
      throw new BadRequestException('Product does not exist');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.feUrl}/checkout/session-success`,
      cancel_url: `${this.feUrl}/account?session=cancelled`,
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email, // either customer or customer_email can be used
      client_reference_id: user.id,
    });

    return { url: session.url };
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const { stripe, webhookKey } = this.stripeService;
    let event: Stripe.Event;

    if (!req.body) {
      throw new BadRequestException('Empty body');
    }

    try {
      event = stripe.webhooks.constructEvent(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.body, // raw buffer
        signature,
        webhookKey,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { received: false };
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.subscriptionsService.handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.subscriptionsService.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.subscriptionsService.handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.subscriptionsService.handlePaymentFailed(invoice);
        break;
      }

      // default:
      //   console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
