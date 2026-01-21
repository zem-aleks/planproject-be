export type UserEntity = {
  id: string;
  email: string;
  subscription: SubscriptionType;
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
