import { Project } from '../entities/project.entity';
import { ProjectEntity } from '../types/entity';

export const mapProjectToEntity = (
  project: Project,
  logoFolder: string,
): ProjectEntity => {
  return {
    ...project,
    logoUrl:
      !project.logoUrl || project.logoUrl === 'loading'
        ? project.logoUrl
        : `${logoFolder}${project.logoUrl}`,
  };
};
