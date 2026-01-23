export type UserEntity = {
  id: string;
  email: string;
  subscription: SubscriptionType;
  subscriptionPeriod: SubscriptionPeriod;
  subscriptionPeriodEnd: Date | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  firstName: string | null;
  lastName: string | null;
  linkedIn: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const SUBSCRIPTION_TYPES = ['basic', 'pro', 'business'] as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

export const SUBSCRIPTION_PERIODS = ['monthly', 'yearly'] as const;

export type SubscriptionPeriod = (typeof SUBSCRIPTION_PERIODS)[number];
