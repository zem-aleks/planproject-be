import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

import { PhasesService } from '../services/phases.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { Project } from '../../projects/entities/project.entity';
import { Phase } from '../entities/phase.entity';

type PhaseRequest = string; // actual projectId

@Injectable()
export class PhaseByIdPipe implements PipeTransform {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly phasesService: PhasesService,
  ) {}

  async transform(
    request: PhaseRequest,
  ): Promise<{ phase: Phase; project: Project }> {
    const phase = await this.phasesService.getOneByIdOrThrow(request);
    const project = await this.projectsService.getOneByIdOrThrow(
      phase.projectId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { project, phase };
  }
}
