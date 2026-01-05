import { MilestoneDetailsEntity, MilestoneEntity } from '../types/entity';
import { Milestone } from '../entities/milestone.entity';
import { mapPhaseToEntity } from '../../phases/mappers/mapPhaseToEntity';

export const mapMilestoneToEntity = (milestone: Milestone): MilestoneEntity => {
  return {
    ...milestone,
  };
};

export const mapMilestoneToEntityWithDetails = (
  milestone: Milestone,
): MilestoneDetailsEntity => {
  return {
    ...milestone,
    phase: mapPhaseToEntity(milestone.phase),
  };
};
