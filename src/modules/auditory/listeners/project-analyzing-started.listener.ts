import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Project } from '../../plans/projects/entities/project.entity';
import { AuditoryService } from '../services/auditory.service';

@Injectable()
export class ProjectAnalyzingStartedListener {
  constructor(private readonly auditoryService: AuditoryService) {}

  @OnEvent('project.analyzing.started')
  async handleProjectShapingStartedEvent({ project }: { project: Project }) {
    await this.auditoryService.generateForProject(project);
  }
}
