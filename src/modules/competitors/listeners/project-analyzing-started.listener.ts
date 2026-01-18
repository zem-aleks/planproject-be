import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Project } from '../../plans/projects/entities/project.entity';
import { CompetitorsService } from '../services/competitors.service';

@Injectable()
export class ProjectAnalyzingStartedListener {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @OnEvent('project.analyzing.started')
  async handleProjectShapingStartedEvent({ project }: { project: Project }) {
    await this.competitorsService.generateForProject(project);
  }
}
