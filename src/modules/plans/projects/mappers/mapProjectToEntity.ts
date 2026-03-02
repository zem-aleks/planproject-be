import { Project } from '../entities/project.entity';
import { ProjectEntity, ProjectPreviewEntity } from '../types/entity';

export const mapProjectToEntity = (
  project: Project,
  logoFolder: string,
): ProjectEntity => {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    startedAt: project.startedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    completedAt: project.completedAt,
    userId: project.userId,
    shapingId: project.shapingId,
    daysNeeded: project.daysNeeded,
    activated: project.activated,
    soul: project.soul,
    soulQueue: project.soulQueue,
    soulQueueStartedAt: project.soulQueueStartedAt,
    logoUrl:
      !project.logoUrl || project.logoUrl === 'loading'
        ? project.logoUrl
        : `${logoFolder}${project.logoUrl}`,
  };
};

export const mapProjectToPreviewEntity = (
  project: Project,
  logoFolder: string,
): ProjectPreviewEntity => {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    startedAt: project.startedAt,
    daysNeeded: project.daysNeeded,
    activated: project.activated,
    soul: project.soul,
    soulQueue: project.soulQueue,
    soulQueueStartedAt: project.soulQueueStartedAt,
    logoUrl:
      !project.logoUrl || project.logoUrl === 'loading'
        ? project.logoUrl
        : `${logoFolder}${project.logoUrl}`,
  };
};
