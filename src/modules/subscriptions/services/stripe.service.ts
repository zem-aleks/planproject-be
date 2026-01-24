import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  public readonly stripe: Stripe;
  public readonly webhookKey: string;

  constructor(private readonly configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookKey = this.configService.get<string>('STRIPE_WEBHOOK_KEY');
    if (!stripeKey || !webhookKey) {
      throw new Error('Missing Stripe configuration values');
    }

    this.webhookKey = webhookKey;
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-12-15.clover',
    });
  }
}
