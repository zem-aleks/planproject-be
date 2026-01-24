import { SubscriptionPeriod, SubscriptionType } from '../../users/types/entity';

export type SubscriptionEntity = {
  type: SubscriptionType;
  period: SubscriptionPeriod;
  usedProjects: number;
  totalAvailableProjects: number;
  canActivate: boolean;
};
