import { MilestoneEntity } from '../types/entity';
import { Milestone } from '../entities/milestone.entity';

export const mapMilestoneToEntity = (milestone: Milestone): MilestoneEntity => {
  return {
    ...milestone,
  };
};
