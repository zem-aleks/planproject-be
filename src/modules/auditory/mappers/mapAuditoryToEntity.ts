import { Auditory } from '../entities/auditory.entity';
import {
  AuditoryBasicData,
  AuditoryBusinessData,
  AuditoryEntity,
  AuditoryProData,
} from '../types/entity';

export const mapAuditoryToEntity = (item: Auditory): AuditoryEntity => {
  return {
    ...item,
  };
};

export const mapAuditoryBasicData = (item: Auditory): AuditoryBasicData => {
  return {
    id: item.id,
    projectId: item.projectId,
    ageSeparation: item.ageSeparation,
    menPercentage: item.menPercentage,
    tam: item.tam,
    sam: item.sam,
    som: item.som,
  };
};

export const mapAuditoryProData = (item: Auditory): AuditoryProData => {
  return {
    mainSegments: item.mainSegments,
    auditoryDemands: item.auditoryDemands,
    auditoryPains: item.auditoryPains,
  };
};

export const mapAuditoryBusinessData = (
  item: Auditory,
): AuditoryBusinessData => {
  return {
    characters: item.characters,
    differentiation: item.differentiation,
    auditoryChannels: item.auditoryChannels,
  };
};
