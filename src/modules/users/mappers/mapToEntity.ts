import { UserEntity } from '../types/entity';
import { User } from '../entities/user.entity';

export const mapToEntity = (user: User): UserEntity => {
  return {
    id: user.id,
    email: user.email,
    subscription: user.subscription,
    subscriptionPeriod: user.subscriptionPeriod,
    subscriptionPeriodEnd: user.subscriptionPeriodEnd,
    subscriptionStatus: user.subscriptionStatus,
    stripeCustomerId: user.stripeCustomerId,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    firstName: user.firstName,
    lastName: user.lastName,
    linkedIn: user.linkedIn,
    website: user.website,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
