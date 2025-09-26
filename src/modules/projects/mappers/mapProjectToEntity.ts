import { Project } from '../entities/project.entity';
import { ProjectEntity } from '../types/entity';

export const mapProjectToEntity = (project: Project): ProjectEntity => {
  return {
    ...project,
  };
};
