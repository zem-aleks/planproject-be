import { Auditory } from '../entities/auditory.entity';
import { AuditoryEntity } from '../types/entity';

export const mapAuditoryToEntity = (item: Auditory): AuditoryEntity => {
  return {
    ...item,
  };
};
