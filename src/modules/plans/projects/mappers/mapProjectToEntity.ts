import { Project } from '../entities/project.entity';
import { ProjectEntity } from '../types/entity';

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
    logoUrl:
      !project.logoUrl || project.logoUrl === 'loading'
        ? project.logoUrl
        : `${logoFolder}${project.logoUrl}`,
  };
};
