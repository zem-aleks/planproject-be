import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

import { ProjectsService } from '../services/projects.service';
import { Project } from '../entities/project.entity';

type ProjectRequest = string; // actual projectId

@Injectable()
export class ProjectByIdPipe implements PipeTransform {
  constructor(private readonly projectsService: ProjectsService) {}

  async transform(request: ProjectRequest): Promise<Project> {
    const projectId = request;
    const project = await this.projectsService.getOneById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
