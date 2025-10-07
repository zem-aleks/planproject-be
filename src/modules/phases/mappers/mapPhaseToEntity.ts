import { PhaseEntity, PhaseEntityWithMilestones } from '../types/entity';
import { Phase } from '../entities/phase.entity';
import { mapMilestoneToEntity } from '../../milestones/mappers/mapMilestoneToEntity';

export const mapPhaseToEntity = (project: Phase): PhaseEntity => {
  return {
    ...project,
  };
};

export const mapPhaseToEntityWithMilestones = (
  project: Phase,
): PhaseEntityWithMilestones => {
  return {
    ...mapPhaseToEntity(project),
    milestones: (project.milestones || []).map(mapMilestoneToEntity),
  };
};
