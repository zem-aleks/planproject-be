import { PhaseEntity, PhaseEntityWithMilestones } from '../types/entity';
import { Phase } from '../entities/phase.entity';
import { mapMilestoneToEntity } from '../../milestones/mappers/mapMilestoneToEntity';

export const mapPhaseToEntity = (phase: Phase): PhaseEntity => {
  return {
    ...phase,
  };
};

export const mapPhaseToEntityWithMilestones = (
  phase: Phase,
): PhaseEntityWithMilestones => {
  return {
    ...mapPhaseToEntity(phase),
    milestones: (phase.milestones || []).map(mapMilestoneToEntity),
  };
};
