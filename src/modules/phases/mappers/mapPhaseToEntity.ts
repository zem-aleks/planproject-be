import { PhaseEntity } from '../types/entity';
import { Phase } from '../entities/phase.entity';

export const mapPhaseToEntity = (project: Phase): PhaseEntity => {
  return {
    ...project,
  };
};
